import http from 'http';
import app from './app.js';
import { ENV } from './config/env.js';
import { initSocket } from './config/socket.js';
import { checkDatabaseConnection, prisma } from './config/db.js';
import { redisClient } from './config/redis.js';

// Server initialized with persistent session connection pool & Redis
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(httpServer);

// Start server
httpServer.listen(ENV.PORT, async () => {
  console.log(`=========================================`);
  console.log(`🎮 BeTrueGamers Server running on port ${ENV.PORT}`);
  console.log(`📡 Environment: ${ENV.NODE_ENV}`);
  console.log(`🔗 API Base: http://localhost:${ENV.PORT}/api`);
  console.log(`⚡ Socket.IO Ready`);
  console.log(`=========================================`);

  // Check DB connection on startup
  await checkDatabaseConnection();
});

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  if (redisClient) {
    try { await redisClient.quit(); } catch (e) {}
  }
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('HTTP, Socket, Prisma, and Redis connections closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
