import { notificationService } from '../services/notification.service.js';

export const notificationController = {
  async getNotifications(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const [notifications, unreadCount] = await Promise.all([
        notificationService.getNotifications(
          req.user.id,
          limit ? parseInt(limit, 10) : 50,
          offset ? parseInt(offset, 10) : 0
        ),
        notificationService.getUnreadCount(req.user.id)
      ]);
      res.status(200).json({
        success: true,
        unreadCount,
        data: notifications
      });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};
