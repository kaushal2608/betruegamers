import { Server } from 'socket.io';
import { ENV } from './env.js';
import { setupSockets } from '../sockets/index.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow no origin (curl/mobile/tools) and any origin in development
        if (!origin || ENV.NODE_ENV === 'development') {
          return callback(null, true);
        }
        if (origin === ENV.CLIENT_URL || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
        callback(null, false);
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Mount authenticated socket event handlers
  setupSockets(io);

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet!');
  }
  return io;
};
