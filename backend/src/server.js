import express from 'express';
import http from 'node:http';

import app from './expressApp.js';

import { initSocket } from './config/socket.js';

/*
|--------------------------------------------------------------------------
| HTTP SERVER
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Socket.IO must be attached to the SAME HTTP server that Vercel serves.
|
*/

const httpServer = http.createServer(app);

/*
|--------------------------------------------------------------------------
| SOCKET.IO
|--------------------------------------------------------------------------
*/

initSocket(httpServer);

/*
|--------------------------------------------------------------------------
| LOCAL DEVELOPMENT
|--------------------------------------------------------------------------
|
| Vercel handles the server itself.
| We only call listen() when running locally.
|
*/

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT || 5000);

  httpServer.listen(PORT, () => {
    console.log('=========================================');
    console.log(`🎮 BeTrueGamers Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`⚡ Socket.IO Ready`);
    console.log('=========================================');
  });
}

/*
|--------------------------------------------------------------------------
| VERCEL ENTRYPOINT
|--------------------------------------------------------------------------
|
| Vercel needs the actual HTTP server here so Socket.IO can
| intercept /socket.io requests.
|
*/

export default httpServer;