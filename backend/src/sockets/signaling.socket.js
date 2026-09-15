/**
 * In-memory room state stores for Live Arena and Coaching Rooms
 * Map<sessionId, Map<socketId, participant>>
 */
const roomParticipants = new Map();
// Map<sessionId, { socketId, user } | null>
const roomPresenters = new Map();
// Map<socketId, Set<sessionId>>
const socketToRooms = new Map();

export const registerSignalingHandlers = (io, socket) => {
  const getParticipantInfo = (isSharing = false, isMuted = true) => ({
    peerId: socket.id,
    user: {
      id: socket.user?.id,
      username: socket.user?.username || 'Gamer',
      avatar_url: socket.user?.avatar_url || null,
      role: socket.user?.role || 'GAMER'
    },
    isSharingScreen: isSharing,
    isMicMuted: isMuted,
    joinedAt: Date.now()
  });

  const cleanupUserFromRoom = (sessionId) => {
    if (!sessionId) return;
    socket.leave(`session:${sessionId}`);

    const participants = roomParticipants.get(sessionId);
    if (participants) {
      participants.delete(socket.id);
      if (participants.size === 0) {
        roomParticipants.delete(sessionId);
      }
    }

    // If this user was the active screen presenter, clear and broadcast
    const presenter = roomPresenters.get(sessionId);
    if (presenter && (presenter.socketId === socket.id || presenter.user?.id === socket.user?.id)) {
      roomPresenters.delete(sessionId);
      io.to(`session:${sessionId}`).emit('webrtc:screen_presenter_changed', {
        presenterId: null,
        presenterUser: null
      });
    }

    // Broadcast user left
    io.to(`session:${sessionId}`).emit('webrtc:peer_left', {
      peerId: socket.id,
      userId: socket.user?.id,
      username: socket.user?.username
    });

    const userRooms = socketToRooms.get(socket.id);
    if (userRooms) {
      userRooms.delete(sessionId);
      if (userRooms.size === 0) {
        socketToRooms.delete(socket.id);
      }
    }
  };

  // Join a live session / arena room
  socket.on('webrtc:join_room', ({ sessionId }) => {
    if (!sessionId) return;
    socket.join(`session:${sessionId}`);

    if (!roomParticipants.has(sessionId)) {
      roomParticipants.set(sessionId, new Map());
    }

    const participantsMap = roomParticipants.get(sessionId);
    const participant = getParticipantInfo(false, true);
    participantsMap.set(socket.id, participant);

    if (!socketToRooms.has(socket.id)) {
      socketToRooms.set(socket.id, new Set());
    }
    socketToRooms.get(socket.id).add(sessionId);

    console.log(`[WebRTC] User ${socket.user?.username} (${socket.id}) joined room: ${sessionId}. Total: ${participantsMap.size}`);

    // If an active presenter exists, check if that presenter is still in the room
    // OR if the same user is now rejoining fresh (not sharing screen yet)
    let activePresenter = roomPresenters.get(sessionId) || null;
    if (activePresenter) {
      const presenterStillHere = participantsMap.has(activePresenter.socketId);
      const isRejoiningUser = activePresenter.user?.id === socket.user?.id;
      if (!presenterStillHere || isRejoiningUser) {
        roomPresenters.delete(sessionId);
        activePresenter = null;
        io.to(`session:${sessionId}`).emit('webrtc:screen_presenter_changed', {
          presenterId: null,
          presenterUser: null
        });
      }
    }

    const allParticipants = Array.from(participantsMap.values());

    // Send room state back to the newly joined peer
    socket.emit('webrtc:room_state', {
      participants: allParticipants,
      activePresenter
    });

    // Notify all other participants in the room
    socket.to(`session:${sessionId}`).emit('webrtc:peer_joined', {
      participant,
      peerId: socket.id,
      user: participant.user
    });
  });

  // Request to start screen share (Single Presenter Lock)
  socket.on('webrtc:request_screen_share', ({ sessionId }, callback) => {
    if (!sessionId) return;
    const participantsMap = roomParticipants.get(sessionId);
    const currentPresenter = roomPresenters.get(sessionId);

    if (currentPresenter) {
      const isPresenterStillConnected = participantsMap && participantsMap.has(currentPresenter.socketId);
      const isSameUser = socket.user?.id && currentPresenter.user?.id === socket.user.id;

      if (isPresenterStillConnected && !isSameUser && currentPresenter.socketId !== socket.id) {
        const response = {
          allowed: false,
          reason: `${currentPresenter.user?.username || 'Another participant'} is currently sharing their screen.`
        };
        if (typeof callback === 'function') callback(response);
        socket.emit('webrtc:screen_share_denied', response);
        return;
      }
    }

    // Grant presenter role
    const presenterData = {
      socketId: socket.id,
      user: {
        id: socket.user?.id,
        username: socket.user?.username || 'Gamer',
        avatar_url: socket.user?.avatar_url || null
      }
    };

    roomPresenters.set(sessionId, presenterData);

    const participants = roomParticipants.get(sessionId);
    if (participants && participants.has(socket.id)) {
      participants.get(socket.id).isSharingScreen = true;
    }

    if (typeof callback === 'function') callback({ allowed: true });
    socket.emit('webrtc:screen_share_granted', presenterData);

    // Broadcast presenter change to all users in the room
    io.to(`session:${sessionId}`).emit('webrtc:screen_presenter_changed', {
      presenterId: socket.id,
      presenterUser: presenterData.user
    });
  });

  // Stop screen share
  socket.on('webrtc:stop_screen_share', ({ sessionId }) => {
    if (!sessionId) return;
    const currentPresenter = roomPresenters.get(sessionId);
    if (currentPresenter && currentPresenter.socketId === socket.id) {
      roomPresenters.delete(sessionId);

      const participants = roomParticipants.get(sessionId);
      if (participants && participants.has(socket.id)) {
        participants.get(socket.id).isSharingScreen = false;
      }

      io.to(`session:${sessionId}`).emit('webrtc:screen_presenter_changed', {
        presenterId: null,
        presenterUser: null
      });
    }
  });

  // Legacy screen state relay compatibility
  socket.on('webrtc:screen_state', ({ sessionId, isSharing }) => {
    if (!isSharing) {
      const currentPresenter = roomPresenters.get(sessionId);
      if (currentPresenter && currentPresenter.socketId === socket.id) {
        roomPresenters.delete(sessionId);
        io.to(`session:${sessionId}`).emit('webrtc:screen_presenter_changed', {
          presenterId: null,
          presenterUser: null
        });
      }
    }
    socket.to(`session:${sessionId}`).emit('webrtc:peer_screen_state', {
      peerId: socket.id,
      isSharing
    });
  });

  // Mic state sync
  socket.on('webrtc:mic_state', ({ sessionId, isMuted }) => {
    const participants = roomParticipants.get(sessionId);
    if (participants && participants.has(socket.id)) {
      participants.get(socket.id).isMicMuted = isMuted;
    }

    socket.to(`session:${sessionId}`).emit('webrtc:mic_state_changed', {
      peerId: socket.id,
      isMuted
    });
  });

  // WebRTC Signaling: Offer
  socket.on('webrtc:offer', ({ sessionId, offer, targetPeerId }) => {
    if (targetPeerId) {
      io.to(targetPeerId).emit('webrtc:offer', {
        offer,
        senderPeerId: socket.id,
        senderUser: socket.user
      });
    } else {
      socket.to(`session:${sessionId}`).emit('webrtc:offer', {
        offer,
        senderPeerId: socket.id,
        senderUser: socket.user
      });
    }
  });

  // WebRTC Signaling: Answer
  socket.on('webrtc:answer', ({ sessionId, answer, targetPeerId }) => {
    if (targetPeerId) {
      io.to(targetPeerId).emit('webrtc:answer', {
        answer,
        senderPeerId: socket.id
      });
    } else {
      socket.to(`session:${sessionId}`).emit('webrtc:answer', {
        answer,
        senderPeerId: socket.id
      });
    }
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('webrtc:ice_candidate', ({ sessionId, candidate, targetPeerId }) => {
    if (targetPeerId) {
      io.to(targetPeerId).emit('webrtc:ice_candidate', {
        candidate,
        senderPeerId: socket.id
      });
    } else {
      socket.to(`session:${sessionId}`).emit('webrtc:ice_candidate', {
        candidate,
        senderPeerId: socket.id
      });
    }
  });

  // In-session 1-on-1 coaching chat message
  socket.on('webrtc:chat_message', ({ sessionId, text }) => {
    if (!sessionId || !text || !text.trim()) return;
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId,
      sender: {
        id: socket.user?.id,
        username: socket.user?.username || 'User',
        avatar_url: socket.user?.avatar_url || null,
        role: socket.user?.role || 'GAMER'
      },
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    io.to(`session:${sessionId}`).emit('webrtc:chat_message', message);
  });

  // Leave room
  socket.on('webrtc:leave_room', ({ sessionId }) => {
    cleanupUserFromRoom(sessionId);
  });

  // Handle sudden disconnect
  socket.on('disconnect', () => {
    const userRooms = socketToRooms.get(socket.id);
    if (userRooms) {
      userRooms.forEach((sessionId) => {
        cleanupUserFromRoom(sessionId);
      });
    }
  });
};
