import { chatService } from '../services/chat.service.js';

export const registerChatHandlers = (io, socket) => {
  socket.on('chat:join', ({ conversationId }) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`[Socket.IO] User ${socket.user?.username} joined conversation:${conversationId}`);
  });

  socket.on('chat:leave', ({ conversationId }) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('chat:typing', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('chat:user_typing', {
      conversationId,
      userId: socket.user?.id,
      username: socket.user?.username
    });
  });

  socket.on('chat:stop-typing', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('chat:user_stop_typing', {
      conversationId,
      userId: socket.user?.id
    });
  });

  socket.on('chat:send_message', async ({ conversationId, content }) => {
    try {
      if (!content || !content.trim()) return;
      await chatService.sendMessage(conversationId, socket.user, content.trim());
    } catch (err) {
      socket.emit('chat:error', { message: err.message });
    }
  });
};
