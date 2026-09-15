import { prisma } from '../config/db.js';
import { appCache } from '../utils/cache.js';

export const notificationRepository = {
  async createNotification({ userId, type, title, message, data = {} }) {
    appCache.delPrefix('notif:');
    try {
      const notif = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data
        }
      });
      return {
        ...notif,
        user_id: notif.userId,
        is_read: notif.isRead,
        created_at: notif.createdAt
      };
    } catch (e) {
      return { id: 'mock-notif', userId, type, title, message, data, is_read: false };
    }
  },

  async getUserNotifications(userId, limit = 50, offset = 0) {
    return await appCache.getOrSet(`notif:list:${userId}:${limit}:${offset}`, async () => {
      try {
        const notifs = await prisma.notification.findMany({
          where: { userId },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' }
        });

        return notifs.map(n => ({
          id: n.id,
          user_id: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data,
          is_read: n.isRead,
          created_at: n.createdAt
        }));
      } catch (e) {
        return [];
      }
    }, 180);
  },

  async markAsRead(notificationId, userId) {
    appCache.delPrefix('notif:');
    try {
      const notif = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
      return notif;
    } catch (e) {
      return null;
    }
  },

  async markAllAsRead(userId) {
    appCache.delPrefix('notif:');
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    } catch (e) {}
  },

  async getUnreadCount(userId) {
    if (!userId) return 0;
    return await appCache.getOrSet(`notif:count:${userId}`, async () => {
      try {
        return await prisma.notification.count({
          where: { userId, isRead: false }
        });
      } catch (e) {
        return 0;
      }
    }, 180); // 180 seconds TTL (auto-invalidated on notif changes)
  }
};
