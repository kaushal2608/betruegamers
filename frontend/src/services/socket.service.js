import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

const getSocketUrl = () => {
  // Production / configured Socket.IO URL
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  // Local development fallback
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    ) {
      return 'http://localhost:5000';
    }
  }

  // If production environment variable is missing,
  // fail clearly instead of generating an incorrect URL.
  console.error(
    '[Socket.IO] NEXT_PUBLIC_SOCKET_URL is not configured.'
  );

  return null;
};

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    const authToken =
      token ||
      (typeof window !== 'undefined'
        ? Cookies.get('btg_token')
        : null);

    if (!authToken) {
      this.disconnect();
      return null;
    }

    if (this.socket) {
      // Token changed → disconnect old socket
      // and create a new authenticated connection.
      if (
        this.socket.auth?.token &&
        this.socket.auth.token !== authToken
      ) {
        this.disconnect();
      } else if (this.socket.connected) {
        return this.socket;
      } else if (this.socket.active) {
        return this.socket;
      } else {
        this.socket.connect();
        return this.socket;
      }
    }

    const socketUrl = getSocketUrl();

    if (!socketUrl) {
      console.error(
        '[Socket.IO] Cannot connect because socket URL is missing.'
      );
      return null;
    }

    this.socket = io(socketUrl, {
      auth: {
        token: authToken
      },

      withCredentials: true,

      // Start with polling handshake and allow
      // Socket.IO to upgrade to WebSocket.
      transports: ['polling', 'websocket'],

      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log(
        `[Socket.IO] Connected to server: ${this.socket.id}`
      );
    });

    this.socket.on('disconnect', (reason) => {
      console.log(
        `[Socket.IO] Disconnected: ${reason}`
      );
    });

    this.socket.on('connect_error', (err) => {
      console.warn(
        `[Socket.IO Connection Error]: ${err.message}`
      );
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }

    return this.socket;
  }

  emit(event, data) {
    const s = this.getSocket();

    if (s) {
      s.emit(event, data);
    }
  }

  on(event, callback) {
    const s = this.getSocket();

    if (s) {
      s.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  // Conversation Helpers

  joinConversation(conversationId) {
    this.emit('chat:join', {
      conversationId
    });
  }

  leaveConversation(conversationId) {
    this.emit('chat:leave', {
      conversationId
    });
  }

  sendTyping(conversationId) {
    this.emit('chat:typing', {
      conversationId
    });
  }

  sendStopTyping(conversationId) {
    this.emit('chat:stop-typing', {
      conversationId
    });
  }

  // WebRTC Room Helpers

  joinSession(sessionId) {
    this.emit('webrtc:join_room', {
      sessionId
    });
  }

  leaveSession(sessionId) {
    this.emit('webrtc:leave_room', {
      sessionId
    });
  }

  sendOffer(sessionId, offer, targetPeerId) {
    this.emit('webrtc:offer', {
      sessionId,
      offer,
      targetPeerId
    });
  }

  sendAnswer(sessionId, answer, targetPeerId) {
    this.emit('webrtc:answer', {
      sessionId,
      answer,
      targetPeerId
    });
  }

  sendIceCandidate(
    sessionId,
    candidate,
    targetPeerId
  ) {
    this.emit('webrtc:ice_candidate', {
      sessionId,
      candidate,
      targetPeerId
    });
  }

  sendScreenState(sessionId, isSharing) {
    this.emit('webrtc:screen_state', {
      sessionId,
      isSharing
    });
  }

  requestScreenShare(sessionId, callback) {
    const s = this.getSocket();

    if (s) {
      s.emit(
        'webrtc:request_screen_share',
        { sessionId },
        callback
      );
    }
  }

  stopScreenShare(sessionId) {
    this.emit('webrtc:stop_screen_share', {
      sessionId
    });
  }

  sendMicState(sessionId, isMuted) {
    this.emit('webrtc:mic_state', {
      sessionId,
      isMuted
    });
  }

  sendSessionChatMessage(sessionId, text) {
    this.emit('webrtc:chat_message', {
      sessionId,
      text
    });
  }
}

export const socketService = new SocketService();