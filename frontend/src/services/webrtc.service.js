import { socketService } from './socket.service';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCService {
  constructor({
    sessionId,
    currentUser,
    onRemoteScreenStream,
    onConnectionState,
    onParticipantsUpdate,
    onPresenterChange,
    onScreenState
  }) {
    this.sessionId = sessionId;
    this.currentUser = currentUser;
    this.onRemoteScreenStream = onRemoteScreenStream;
    this.onConnectionState = onConnectionState;
    this.onParticipantsUpdate = onParticipantsUpdate;
    this.onPresenterChange = onPresenterChange;
    this.onScreenState = onScreenState;

    // Map<peerId, RTCPeerConnection>
    this.peerConnections = new Map();
    // Map<peerId, HTMLAudioElement>
    this.audioElements = new Map();
    // Queue candidates if remoteDescription is not ready yet: Map<peerId, RTCIceCandidateInit[]>
    this.candidateQueue = new Map();

    this.localScreenStream = null;
    this.localAudioStream = null;
    this.isMicMuted = true;
    this.activePresenter = null;
    this.participants = [];
  }

  async flushCandidateQueue(peerId, pc) {
    const queue = this.candidateQueue.get(peerId);
    if (queue && queue.length > 0) {
      for (const cand of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('[WebRTC] Error adding queued ICE candidate:', e);
        }
      }
      this.candidateQueue.delete(peerId);
    }
  }

  async initialize() {
    const socket = socketService.getSocket();
    if (!socket) {
      console.warn('[WebRTC] Socket not available during init');
      return;
    }

    // 1. Initial Room State from server
    socketService.on('webrtc:room_state', ({ participants, activePresenter }) => {
      console.log('[WebRTC] Room state received:', participants?.length, 'participants. Presenter:', activePresenter);
      this.participants = participants || [];
      this.activePresenter = activePresenter;

      if (this.onParticipantsUpdate) {
        this.onParticipantsUpdate(this.participants);
      }
      if (this.onPresenterChange) {
        this.onPresenterChange(this.activePresenter);
      }
      if (this.onConnectionState) {
        this.onConnectionState('connected');
      }
    });

    // 2. New Peer Joined the Room
    socketService.on('webrtc:peer_joined', async ({ peerId, participant, user }) => {
      console.log('[WebRTC] Peer joined room:', user?.username, peerId);

      const existingIndex = this.participants.findIndex((p) => p.peerId === peerId);
      if (existingIndex >= 0) {
        this.participants[existingIndex] = participant || { peerId, user };
      } else {
        this.participants.push(participant || { peerId, user, isMicMuted: true, isSharingScreen: false });
      }

      if (this.onParticipantsUpdate) {
        this.onParticipantsUpdate([...this.participants]);
      }

      // Existing peers initiate WebRTC connection to newly joined peer
      await this.createPeerConnectionFor(peerId, true);
    });

    // 3. WebRTC Offer Received
    socketService.on('webrtc:offer', async ({ offer, senderPeerId, senderUser }) => {
      console.log('[WebRTC] Received offer from peer:', senderPeerId, senderUser?.username);
      let pc = this.peerConnections.get(senderPeerId);
      if (!pc) {
        pc = await this.createPeerConnectionFor(senderPeerId, false);
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await this.flushCandidateQueue(senderPeerId, pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketService.sendAnswer(this.sessionId, answer, senderPeerId);
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    });

    // 4. WebRTC Answer Received
    socketService.on('webrtc:answer', async ({ answer, senderPeerId }) => {
      console.log('[WebRTC] Received answer from peer:', senderPeerId);
      const pc = this.peerConnections.get(senderPeerId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await this.flushCandidateQueue(senderPeerId, pc);
        } catch (err) {
          console.error('[WebRTC] Error handling answer:', err);
        }
      }
    });

    // 5. ICE Candidate Received
    socketService.on('webrtc:ice_candidate', async ({ candidate, senderPeerId }) => {
      if (!candidate) return;
      const pc = this.peerConnections.get(senderPeerId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('[WebRTC] Error adding ICE candidate:', err);
        }
      } else {
        if (!this.candidateQueue.has(senderPeerId)) {
          this.candidateQueue.set(senderPeerId, []);
        }
        this.candidateQueue.get(senderPeerId).push(candidate);
      }
    });

    // 6. Presenter Changed (Single Presenter Lock)
    socketService.on('webrtc:screen_presenter_changed', ({ presenterId, presenterUser }) => {
      console.log('[WebRTC] Screen presenter changed:', presenterUser?.username, presenterId);
      this.activePresenter = presenterId ? { socketId: presenterId, user: presenterUser } : null;

      // Update participant screen state in list
      this.participants = this.participants.map((p) => ({
        ...p,
        isSharingScreen: p.peerId === presenterId
      }));

      if (this.onParticipantsUpdate) {
        this.onParticipantsUpdate([...this.participants]);
      }
      if (this.onPresenterChange) {
        this.onPresenterChange(this.activePresenter);
      }

      if (!presenterId && this.onRemoteScreenStream) {
        this.onRemoteScreenStream(null);
      }
    });

    // 7. Mic State Changed
    socketService.on('webrtc:mic_state_changed', ({ peerId, isMuted }) => {
      this.participants = this.participants.map((p) => (p.peerId === peerId ? { ...p, isMicMuted: isMuted } : p));
      if (this.onParticipantsUpdate) {
        this.onParticipantsUpdate([...this.participants]);
      }
    });

    // 8. Peer Left Room
    socketService.on('webrtc:peer_left', ({ peerId, username }) => {
      console.log('[WebRTC] Peer left:', username, peerId);
      this.closePeerConnection(peerId);

      this.participants = this.participants.filter((p) => p.peerId !== peerId);
      if (this.onParticipantsUpdate) {
        this.onParticipantsUpdate([...this.participants]);
      }

      if (this.activePresenter?.socketId === peerId) {
        this.activePresenter = null;
        if (this.onPresenterChange) {
          this.onPresenterChange(null);
        }
        if (this.onRemoteScreenStream) {
          this.onRemoteScreenStream(null);
        }
      }
    });

    // Join room via socket
    socketService.joinSession(this.sessionId);

    // Register user interaction handler to unlock and play remote audio if blocked by autoplay policy
    this._unlockHandler = () => {
      this.unlockAllAudio();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('click', this._unlockHandler, { passive: true });
      document.addEventListener('touchstart', this._unlockHandler, { passive: true });
      document.addEventListener('keydown', this._unlockHandler, { passive: true });
    }
  }

  unlockAllAudio() {
    this.audioElements.forEach((audio) => {
      if (audio && audio.srcObject) {
        audio.muted = false;
        audio.volume = 1.0;
        audio.play().catch(() => {});
      }
    });
  }

  async createPeerConnectionFor(peerId, isInitiator) {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId);
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(peerId, pc);

    // Add audio transceiver so initial SDP offer/answer negotiates bi-directional audio right away
    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    } catch (e) {
      console.warn('[WebRTC] addTransceiver audio warning:', e);
    }

    // Add existing local tracks (Screen & Mic) to new peer connection
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localScreenStream);
      });
    }

    if (this.localAudioStream) {
      const audioTrack = this.localAudioStream.getAudioTracks()[0];
      if (audioTrack) {
        const audioSender = pc.getSenders().find(
          (s) => s.track?.kind === 'audio' || (!s.track && s.dtlsTransport)
        );
        if (audioSender) {
          audioSender.replaceTrack(audioTrack).catch(console.warn);
        } else {
          pc.addTrack(audioTrack, this.localAudioStream);
        }
      }
    }

    // Handle remote tracks from this peer
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received ${event.track.kind} track from peer:`, peerId);

      const stream = (event.streams && event.streams[0])
        ? event.streams[0]
        : new MediaStream([event.track]);

      if (event.track.kind === 'video') {
        // Screen share video stream from presenter
        if (this.onRemoteScreenStream) {
          this.onRemoteScreenStream(stream);
        }
      } else if (event.track.kind === 'audio') {
        // Play remote participant's voice
        this.playRemoteAudio(peerId, stream);
        event.track.onunmute = () => {
          this.playRemoteAudio(peerId, stream);
        };
      }
    };

    // Relay local ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(this.sessionId, event.candidate, peerId);
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer ${peerId} connection state:`, pc.connectionState);
      if (this.onConnectionState) {
        this.onConnectionState(pc.connectionState);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer({
          offerToReceiveVideo: true,
          offerToReceiveAudio: true
        });
        await pc.setLocalDescription(offer);
        socketService.sendOffer(this.sessionId, offer, peerId);
      } catch (err) {
        console.error(`[WebRTC] Failed to create offer for ${peerId}:`, err);
      }
    }

    return pc;
  }

  playRemoteAudio(peerId, stream) {
    if (!stream) return;
    let audio = this.audioElements.get(peerId);
    if (!audio && typeof document !== 'undefined') {
      audio = document.createElement('audio');
      audio.autoplay = true;
      audio.playsInline = true;
      // Position off-screen rather than display: none to prevent browser audio pipeline throttling
      audio.style.position = 'fixed';
      audio.style.top = '-9999px';
      audio.style.left = '-9999px';
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0.01';
      document.body.appendChild(audio);
      this.audioElements.set(peerId, audio);
    }
    if (audio) {
      audio.muted = false;
      audio.volume = 1.0;
      if (audio.srcObject !== stream) {
        audio.srcObject = stream;
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn('[WebRTC] Autoplay audio error, will play on user interaction:', e);
        });
      }
    }
  }

  async startScreenShare() {
    return new Promise((resolve, reject) => {
      // 1. Request server permission for single presenter lock
      socketService.requestScreenShare(this.sessionId, async (res) => {
        if (!res?.allowed) {
          const reason = res?.reason || 'Another user is already sharing their screen.';
          return reject(new Error(reason));
        }

        if (!navigator?.mediaDevices?.getDisplayMedia) {
          socketService.stopScreenShare(this.sessionId);
          return reject(
            new Error(
              'Screen sharing is not supported on this browser/device (e.g. mobile phones) or requires HTTPS / secure context when accessing over local network IP.'
            )
          );
        }

        try {
          // 2. Open screen picker
          this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              cursor: 'always',
              frameRate: { max: 60 }
            },
            audio: true
          });

          // 3. Add tracks to all peer connections
          this.peerConnections.forEach((pc, peerId) => {
            this.localScreenStream.getTracks().forEach((track) => {
              pc.addTrack(track, this.localScreenStream);
            });
            this.renegotiateWithPeer(peerId);
          });

          // Handle user stopping screen share via native browser bar
          const screenVideoTrack = this.localScreenStream.getVideoTracks()[0];
          if (screenVideoTrack) {
            screenVideoTrack.onended = () => {
              this.stopScreenShare();
            };
          }

          if (this.onScreenState) {
            this.onScreenState(true);
          }

          resolve(this.localScreenStream);
        } catch (err) {
          // Cancelled picker
          socketService.stopScreenShare(this.sessionId);
          reject(err);
        }
      });
    });
  }

  stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => track.stop());
      this.localScreenStream = null;
    }

    // Remove video senders from each peer connection
    this.peerConnections.forEach((pc, peerId) => {
      const senders = pc.getSenders();
      senders.forEach((sender) => {
        if (sender.track && sender.track.kind === 'video') {
          try {
            pc.removeTrack(sender);
          } catch (e) {
            // ignore
          }
        }
      });
      this.renegotiateWithPeer(peerId);
    });

    socketService.stopScreenShare(this.sessionId);

    if (this.onScreenState) {
      this.onScreenState(false);
    }
  }

  async toggleMicrophone(enabled) {
    this.isMicMuted = !enabled;

    if (enabled) {
      if (!this.localAudioStream) {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error(
            'Microphone access is unavailable on this browser/context. If accessing over a local IP (http://192.168.x.x), please open chrome://flags/#unsafely-treat-insecure-origin-as-secure and add this URL to allow microphone.'
          );
        }

        try {
          this.localAudioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch (err) {
          throw new Error(
            err.name === 'NotAllowedError'
              ? 'Microphone permission denied. Please allow microphone access in your browser address bar.'
              : `Microphone error: ${err.message}`
          );
        }

        const audioTrack = this.localAudioStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = true;
          this.peerConnections.forEach((pc, peerId) => {
            const senders = pc.getSenders();
            const existingAudioSender = senders.find(
              (s) => s.track?.kind === 'audio' || (!s.track && s.dtlsTransport)
            );
            if (existingAudioSender) {
              existingAudioSender.replaceTrack(audioTrack).catch(console.warn);
            } else {
              pc.addTrack(audioTrack, this.localAudioStream);
              this.renegotiateWithPeer(peerId);
            }
          });
        }
      } else {
        this.localAudioStream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
      }
    } else {
      if (this.localAudioStream) {
        this.localAudioStream.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
    }

    socketService.sendMicState(this.sessionId, !enabled);
  }

  async renegotiateWithPeer(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return;
    try {
      const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: true
      });
      await pc.setLocalDescription(offer);
      socketService.sendOffer(this.sessionId, offer, peerId);
    } catch (err) {
      console.warn(`[WebRTC] Renegotiation with ${peerId} error:`, err);
    }
  }

  closePeerConnection(peerId) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    const audio = this.audioElements.get(peerId);
    if (audio) {
      audio.srcObject = null;
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
      this.audioElements.delete(peerId);
    }
  }

  cleanup() {
    if (typeof document !== 'undefined' && this._unlockHandler) {
      document.removeEventListener('click', this._unlockHandler);
      document.removeEventListener('touchstart', this._unlockHandler);
      document.removeEventListener('keydown', this._unlockHandler);
    }

    this.stopScreenShare();

    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((t) => t.stop());
      this.localAudioStream = null;
    }

    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    this.audioElements.forEach((audio) => {
      audio.srcObject = null;
      if (audio.parentNode) {
        audio.parentNode.removeChild(audio);
      }
    });
    this.audioElements.clear();

    socketService.leaveSession(this.sessionId);
    socketService.off('webrtc:room_state');
    socketService.off('webrtc:peer_joined');
    socketService.off('webrtc:offer');
    socketService.off('webrtc:answer');
    socketService.off('webrtc:ice_candidate');
    socketService.off('webrtc:screen_presenter_changed');
    socketService.off('webrtc:mic_state_changed');
    socketService.off('webrtc:peer_left');
  }
}
