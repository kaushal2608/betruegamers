import { gameService } from '../services/game.service.js';

export const gameController = {
  async getAll(req, res, next) {
    try {
      const { search, genre, limit, offset } = req.query;
      const games = await gameService.getAllGames({
        search,
        genre,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0
      });
      res.status(200).json({
        success: true,
        count: games.length,
        data: games
      });
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const game = await gameService.getGameBySlug(req.params.slug);
      res.status(200).json({
        success: true,
        data: game
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const newGame = await gameService.createGame(req.body);
      res.status(201).json({
        success: true,
        message: 'Game created successfully',
        data: newGame
      });
    } catch (err) {
      next(err);
    }
  }
};
