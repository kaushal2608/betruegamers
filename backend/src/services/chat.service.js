import { chatRepository } from '../repositories/chat.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { getIO } from '../config/socket.js';

export const chatService = {
  async getOrCreateConversation(userId1, userId2) {
    if (userId1 === userId2) {
      const error = new Error('Cannot start a conversation with yourself');
      error.statusCode = 400;
      throw error;
    }

    let conversation = await chatRepository.findDirectConversation(userId1, userId2);
    if (!conversation) {
      conversation = await chatRepository.createDirectConversation(userId1, userId2);
    }
    return conversation;
  },

  async getUserConversations(userId) {
    return await chatRepository.getUserConversations(userId);
  },

  async markConversationAsRead(conversationId, userId) {
    return await chatRepository.markConversationAsRead(conversationId, userId);
  },

  async getMessages(conversationId, userId, limit, offset) {
    const isMember = await chatRepository.isUserInConversation(conversationId, userId);
    if (!isMember) {
      const error = new Error('You are not a member of this conversation');
      error.statusCode = 403;
      throw error;
    }
    // Mark as read for this user
    await chatRepository.markConversationAsRead(conversationId, userId);
    return await chatRepository.getMessages(conversationId, limit, offset);
  },

  async sendMessage(conversationId, sender, content) {
    const isMember = await chatRepository.isUserInConversation(conversationId, sender.id);
    if (!isMember) {
      const error = new Error('You are not a member of this conversation');
      error.statusCode = 403;
      throw error;
    }

    const message = await chatRepository.saveMessage({
      conversationId,
      senderId: sender.id,
      content
    });

    try {
      const io = getIO();
      // 1. Emit to the conversation room (for anyone actively looking at this conversation)
      io.to(`conversation:${conversationId}`).emit('chat:message', message);

      // 2. Also emit to other member's personal room (for conversation list update, sound/snackbar, unread count)
      const recipientId = await chatRepository.getOtherMemberInDirectConversation(conversationId, sender.id);
      if (recipientId) {
        io.to(`user:${recipientId}`).emit('chat:message_received', {
          conversationId,
          message
        });
      }
    } catch (e) {
      console.warn('[Socket Chat Emit Warning]:', e.message);
    }

    return message;
  }
};
