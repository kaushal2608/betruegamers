import { coachService } from '../services/coach.service.js';

export const coachController = {
  async getAll(req, res, next) {
    try {
      const { search, q, game, rank, experience, rating, limit, offset } = req.query;
      const coaches = await coachService.getAllCoaches({
        search: search || q,
        game,
        rank,
        experience,
        rating,
        excludeUserId: req.user?.id,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0
      });
      res.status(200).json({
        success: true,
        count: coaches.length,
        data: coaches
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const coach = await coachService.getCoachById(req.params.id);
      res.status(200).json({
        success: true,
        data: coach
      });
    } catch (err) {
      next(err);
    }
  }
};
