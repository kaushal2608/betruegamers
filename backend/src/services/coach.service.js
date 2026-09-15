import { coachRepository } from '../repositories/coach.repository.js';

export const coachService = {
  async getAllCoaches(filters) {
    return await coachRepository.findAll(filters);
  },

  async getCoachById(coachId) {
    const coach = await coachRepository.findById(coachId);
    if (!coach) {
      const error = new Error('Coach not found');
      error.statusCode = 404;
      throw error;
    }
    return coach;
  }
};
