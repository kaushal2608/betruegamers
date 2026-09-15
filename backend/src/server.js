import http from 'node:http';
import app from './app.js';
import { ENV } from './config/env.js';
import { initSocket } from './config/socket.js';
import { checkDatabaseConnection } from './config/db.js';

// Create the Node.js HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO on the same HTTP server
const io = initSocket(httpServer);

console.log('=========================================');
console.log('🎮 BeTrueGamers Backend Initialized');
console.log(`📡 Environment: ${ENV.NODE_ENV}`);
console.log('⚡ Socket.IO Initialized');
console.log('=========================================');

// Check database connection
checkDatabaseConnection();

// Vercel needs the HTTP server exported.
// The server must not call listen() inside the Vercel environment.
export default httpServer;

// Local development only
if (!process.env.VERCEL) {
  const port = ENV.PORT || 5000;

  httpServer.listen(port, () => {
    console.log('=========================================');
    console.log(`🎮 BeTrueGamers Server running on port ${port}`);
    console.log(`🔗 API Base: http://localhost:${port}/api`);
    console.log(`❤️ Health: http://localhost:${port}/health`);
    console.log('⚡ Socket.IO Ready');
    console.log('=========================================');
  });
}