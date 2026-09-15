import { coachingService } from '../services/coaching.service.js';

export const coachingController = {
  async requestSession(req, res, next) {
    try {
      const { coachId, gameId, durationMinutes, goals, scheduledAt } = req.body;
      const session = await coachingService.requestSession({
        gamer: req.user,
        coachId,
        gameId,
        durationMinutes,
        goals,
        scheduledAt
      });
      res.status(201).json({
        success: true,
        message: 'Coaching session requested',
        data: session
      });
    } catch (err) {
      next(err);
    }
  },

  async getSession(req, res, next) {
    try {
      const session = await coachingService.getSession(req.params.id, req.user.id);
      res.status(200).json({
        success: true,
        data: session
      });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updated = await coachingService.updateStatus(req.params.id, req.user.id, status);
      res.status(200).json({
        success: true,
        message: `Session status updated to ${status}`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  async getUserSessions(req, res, next) {
    try {
      const sessions = await coachingService.getUserSessions(req.user.id);
      res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (err) {
      next(err);
    }
  },

  async submitReview(req, res, next) {
    try {
      const { sessionId, rating, reviewText } = req.body;
      const review = await coachingService.submitReview({
        sessionId,
        gamerId: req.user.id,
        rating,
        reviewText
      });
      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: review
      });
    } catch (err) {
      next(err);
    }
  }
};
