import { notificationRepository } from '../repositories/notification.repository.js';

export const notificationService = {
  async getNotifications(userId, limit, offset) {
    return await notificationRepository.getUserNotifications(userId, limit, offset);
  },

  async markAsRead(notificationId, userId) {
    return await notificationRepository.markAsRead(notificationId, userId);
  },

  async markAllAsRead(userId) {
    await notificationRepository.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  },

  async getUnreadCount(userId) {
    return await notificationRepository.getUnreadCount(userId);
  }
};
