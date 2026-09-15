import { friendService } from '../services/friend.service.js';

export const friendController = {
  async sendRequest(req, res, next) {
    try {
      const { receiverId } = req.body;
      const request = await friendService.sendFriendRequest(req.user, receiverId);
      res.status(201).json({
        success: true,
        message: 'Friend request sent',
        data: request
      });
    } catch (err) {
      next(err);
    }
  },

  async acceptRequest(req, res, next) {
    try {
      const result = await friendService.acceptFriendRequest(req.params.id, req.user.id, req.user.username);
      res.status(200).json({
        success: true,
        message: 'Friend request accepted!',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async rejectRequest(req, res, next) {
    try {
      const result = await friendService.rejectFriendRequest(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Friend request rejected.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async cancelRequest(req, res, next) {
    try {
      const result = await friendService.cancelFriendRequest(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Friend request un-sent successfully.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async removeFriend(req, res, next) {
    try {
      const result = await friendService.removeFriend(req.user.id, req.params.friendId);
      res.status(200).json({
        success: true,
        message: 'Friend removed from your network.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getFriends(req, res, next) {
    try {
      const { q } = req.query;
      if (q && q.trim()) {
        const friends = await friendService.searchFriends(req.user.id, q);
        return res.status(200).json({
          success: true,
          data: friends
        });
      }
      const friends = await friendService.getFriends(req.user.id);
      res.status(200).json({
        success: true,
        data: friends
      });
    } catch (err) {
      next(err);
    }
  },

  async searchFriends(req, res, next) {
    try {
      const { q } = req.query;
      const friends = await friendService.searchFriends(req.user.id, q);
      res.status(200).json({
        success: true,
        data: friends
      });
    } catch (err) {
      next(err);
    }
  },

  async getPendingRequests(req, res, next) {
    try {
      const requests = await friendService.getPendingRequests(req.user.id);
      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (err) {
      next(err);
    }
  }
};
