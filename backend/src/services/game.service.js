import { gameRepository } from '../repositories/game.repository.js';

export const gameService = {
  async getAllGames(filters) {
    return await gameRepository.findAll(filters);
  },

  async getGameBySlug(slug) {
    const game = await gameRepository.findBySlug(slug);
    if (!game) {
      const error = new Error('Game not found');
      error.statusCode = 404;
      throw error;
    }
    return game;
  },

  async createGame(data) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return await gameRepository.createGame({ ...data, slug });
  },

  async getUserGames(userId) {
    return await gameRepository.getUserGames(userId);
  },

  async addUserGame(userId, data) {
    return await gameRepository.addUserGame({ userId, ...data });
  },

  async removeUserGame(userId, gameId) {
    return await gameRepository.removeUserGame(userId, gameId);
  }
};
