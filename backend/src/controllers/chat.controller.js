import { chatService } from '../services/chat.service.js';

export const chatController = {
  async getConversations(req, res, next) {
    try {
      const conversations = await chatService.getUserConversations(req.user.id);
      res.status(200).json({
        success: true,
        data: conversations
      });
    } catch (err) {
      next(err);
    }
  },

  async startConversation(req, res, next) {
    try {
      const { recipientId } = req.body;
      const conversation = await chatService.getOrCreateConversation(req.user.id, recipientId);
      res.status(201).json({
        success: true,
        data: conversation
      });
    } catch (err) {
      next(err);
    }
  },

  async getMessages(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const parsedLimit = limit !== undefined ? parseInt(limit, 10) : 10;
      const parsedOffset = offset !== undefined ? parseInt(offset, 10) : 0;
      const result = await chatService.getMessages(
        req.params.id,
        req.user.id,
        parsedLimit,
        parsedOffset
      );
      res.status(200).json({
        success: true,
        data: result.messages,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          has_more: result.has_more
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async sendMessage(req, res, next) {
    try {
      const { content } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
      }
      const message = await chatService.sendMessage(req.params.id, req.user, content.trim());
      res.status(201).json({
        success: true,
        data: message
      });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      await chatService.markConversationAsRead(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Conversation marked as read'
      });
    } catch (err) {
      next(err);
    }
  }
};
