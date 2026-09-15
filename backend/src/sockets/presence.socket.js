// In-memory set of currently connected user IDs
const onlineUsers = new Set();

export const registerPresenceHandlers = (io, socket) => {
  const userId = socket.user?.id;
  if (userId) {
    onlineUsers.add(userId);
    // Broadcast user's online presence to all other sockets
    io.emit('presence:online', { userId });

    // Send the current list of online users directly to this newly connected user
    socket.emit('presence:list', Array.from(onlineUsers));

    socket.on('presence:query', () => {
      socket.emit('presence:list', Array.from(onlineUsers));
    });

    socket.on('disconnect', () => {
      // Check if user has other open sockets/tabs
      const sockets = io.sockets.sockets;
      let hasOtherSockets = false;
      for (const [id, s] of sockets) {
        if (id !== socket.id && s.user?.id === userId) {
          hasOtherSockets = true;
          break;
        }
      }

      if (!hasOtherSockets) {
        onlineUsers.delete(userId);
        io.emit('presence:offline', { userId });
      }
    });
  }
};
