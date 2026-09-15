import { verifyToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/user.repository.js';
import { registerPresenceHandlers } from './presence.socket.js';
import { registerChatHandlers } from './chat.socket.js';
import { registerNotificationHandlers } from './notification.socket.js';
import { registerSignalingHandlers } from './signaling.socket.js';

export const setupSockets = (io) => {
  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token || socket.handshake.query?.token;

      // Also check cookies from handshake headers
      if (!token && socket.handshake.headers?.cookie) {
        const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)btg_token=([^;]*)/);
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }

      if (!token) {
        // Allow guest or reject
        return next(new Error('Authentication token required for real-time connection'));
      }

      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        return next(new Error('Invalid or expired socket token'));
      }

      const user = await userRepository.findById(decoded.id);
      if (!user || user.is_blocked) {
        return next(new Error('User unauthorized or suspended'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Authenticated connection established: ${socket.user?.username} (${socket.id})`);

    // Register all socket modules
    registerPresenceHandlers(io, socket);
    registerNotificationHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerSignalingHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Socket disconnected: ${socket.user?.username} (${socket.id}), reason: ${reason}`);
    });
  });
};
