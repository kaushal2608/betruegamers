export const registerNotificationHandlers = (io, socket) => {
  const userId = socket.user?.id;
  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`[Socket.IO] User ${socket.user?.username} joined notification room user:${userId}`);
  }
};
