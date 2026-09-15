import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:5000`;
    }
  }
  return 'http://localhost:5000';
};

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    const authToken = token || (typeof window !== 'undefined' ? Cookies.get('btg_token') : null);

    if (!authToken) {
      this.disconnect();
      return null;
    }

    if (this.socket) {
      // If token changed, disconnect old socket and re-create for the new user
      if (this.socket.auth?.token && this.socket.auth.token !== authToken) {
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
    this.socket = io(socketUrl, {
      auth: { token: authToken },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log(`[Socket.IO] Connected to server: ${this.socket.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (err) => {
      console.warn(`[Socket.IO Connection Error]: ${err.message}`);
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
    this.emit('chat:join', { conversationId });
  }

  leaveConversation(conversationId) {
    this.emit('chat:leave', { conversationId });
  }

  sendTyping(conversationId) {
    this.emit('chat:typing', { conversationId });
  }

  sendStopTyping(conversationId) {
    this.emit('chat:stop-typing', { conversationId });
  }

  // WebRTC Room Helpers
  joinSession(sessionId) {
    this.emit('webrtc:join_room', { sessionId });
  }

  leaveSession(sessionId) {
    this.emit('webrtc:leave_room', { sessionId });
  }

  sendOffer(sessionId, offer, targetPeerId) {
    this.emit('webrtc:offer', { sessionId, offer, targetPeerId });
  }

  sendAnswer(sessionId, answer, targetPeerId) {
    this.emit('webrtc:answer', { sessionId, answer, targetPeerId });
  }

  sendIceCandidate(sessionId, candidate, targetPeerId) {
    this.emit('webrtc:ice_candidate', { sessionId, candidate, targetPeerId });
  }

  sendScreenState(sessionId, isSharing) {
    this.emit('webrtc:screen_state', { sessionId, isSharing });
  }

  requestScreenShare(sessionId, callback) {
    const s = this.getSocket();
    if (s) {
      s.emit('webrtc:request_screen_share', { sessionId }, callback);
    }
  }

  stopScreenShare(sessionId) {
    this.emit('webrtc:stop_screen_share', { sessionId });
  }

  sendMicState(sessionId, isMuted) {
    this.emit('webrtc:mic_state', { sessionId, isMuted });
  }

  sendSessionChatMessage(sessionId, text) {
    this.emit('webrtc:chat_message', { sessionId, text });
  }
}

export const socketService = new SocketService();
