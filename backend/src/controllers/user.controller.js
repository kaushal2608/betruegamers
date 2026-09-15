import { userService } from '../services/user.service.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

export const userController = {
  async getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const updatedUser = await userService.updateProfile(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (err) {
      next(err);
    }
  },

  async updateTheme(req, res, next) {
    try {
      const { theme } = req.body;
      const result = await userService.updateTheme(req.user.id, theme);
      res.status(200).json({
        success: true,
        message: 'Theme preference saved',
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getUserGames(req, res, next) {
    try {
      const games = await userService.getUserGames(req.params.id);
      res.status(200).json({
        success: true,
        data: games
      });
    } catch (err) {
      next(err);
    }
  },

  async addUserGame(req, res, next) {
    try {
      const userGame = await userService.addUserGame(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Game linked to profile',
        data: userGame
      });
    } catch (err) {
      next(err);
    }
  },

  async removeUserGame(req, res, next) {
    try {
      await userService.removeUserGame(req.user.id, req.params.gameId);
      res.status(200).json({
        success: true,
        message: 'Game unlinked from profile'
      });
    } catch (err) {
      next(err);
    }
  },

  async searchUsers(req, res, next) {
    try {
      const { q, search, game, rank, role, limit, offset } = req.query;
      const users = await userService.searchUsers({
        query: search || q,
        game,
        rank,
        role,
        excludeUserId: req.user?.id,
        requestingUserRole: req.user?.role,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0
      });
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      let avatarUrl = req.body?.avatarUrl;

      // Check if image file was uploaded
      if (req.file) {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: 'betruegamers/avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' }
          ]
        });
        avatarUrl = result.secure_url;
      } else if (req.body?.image) {
        // Base64 or Data URI
        const result = await uploadToCloudinary(req.body.image, {
          folder: 'betruegamers/avatars',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto:good' }
          ]
        });
        avatarUrl = result.secure_url;
      }

      if (!avatarUrl) {
        return res.status(400).json({
          success: false,
          message: 'No avatar image or URL provided'
        });
      }

      // Update user avatar in DB and invalidate Redis cache
      const updatedUser = await userService.updateProfile(req.user.id, {
        avatar_url: avatarUrl
      });

      return res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
        data: {
          avatar_url: avatarUrl,
          user: updatedUser
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
