import { Server } from 'socket.io';
import { ENV } from './env.js';
import { setupSockets } from '../sockets/index.js';

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    transports: ['websocket'],
    cors: {
      origin: (origin, callback) => {
        // Allow requests without an Origin header
        // (curl, mobile clients, server-side tools, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Development
        if (ENV.NODE_ENV === 'development') {
          return callback(null, true);
        }

        // Production frontend
        if (origin === ENV.CLIENT_URL) {
          return callback(null, true);
        }

        // Vercel preview deployments
        if (origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }

        // Local development
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }

        console.warn(`[Socket.IO] CORS blocked: ${origin}`);

        return callback(
          new Error('Not allowed by Socket.IO CORS')
        );
      },

      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true
    },

    pingTimeout: 60000,
    pingInterval: 25000,

    // Explicitly keep the default Socket.IO path
    path: '/socket.io'
  });

  // Register application socket events
  setupSockets(io);

  console.log('⚡ [Socket.IO] Server initialized');

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error(
      'Socket.IO has not been initialized yet!'
    );
  }

  return io;
};