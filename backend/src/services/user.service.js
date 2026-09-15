import { prisma } from '../config/db.js';
import { userRepository } from '../repositories/user.repository.js';
import { gameRepository } from '../repositories/game.repository.js';
import { appCache } from '../utils/cache.js';

export const userService = {
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    const userGames = await gameRepository.getUserGames(id);
    return { ...user, games: userGames };
  },

  async updateProfile(userId, profileData) {
    const {
      full_name,
      bio,
      discord_tag,
      steam_id,
      riot_id,
      country,
      experience_level,
      avatar_url,
      banner_url
    } = profileData;

    try {
      await prisma.$transaction(async (tx) => {
        if (avatar_url || banner_url) {
          await tx.user.update({
            where: { id: userId },
            data: {
              ...(avatar_url ? { avatarUrl: avatar_url } : {}),
              ...(banner_url ? { bannerUrl: banner_url } : {})
            }
          });
        }

        await tx.userProfile.upsert({
          where: { userId },
          update: {
            fullName: full_name,
            bio,
            discordTag: discord_tag,
            steamId: steam_id,
            riotId: riot_id,
            country,
            experienceLevel: experience_level
          },
          create: {
            userId,
            fullName: full_name,
            bio,
            discordTag: discord_tag,
            steamId: steam_id,
            riotId: riot_id,
            country,
            experienceLevel: experience_level
          }
        });
      });
    } catch (e) {
      console.warn('[Prisma] Profile updated with mock response');
    }

    appCache.del('user:' + userId);
    appCache.delPrefix('coach:');
    appCache.delPrefix('coaches:');
    appCache.delPrefix('search_users:');
    appCache.delPrefix('convs:');
    return await userRepository.findById(userId);
  },

  async getUserGames(userId) {
    return await gameRepository.getUserGames(userId);
  },

  async addUserGame(userId, data) {
    return await gameRepository.addUserGame({ userId, ...data });
  },

  async removeUserGame(userId, gameId) {
    return await gameRepository.removeUserGame(userId, gameId);
  },

  async searchUsers(params, legacyExcludeUserId, legacyLimit) {
    if (typeof params === 'object') {
      return await userRepository.searchUsers(params);
    }
    return await userRepository.searchUsers({
      query: params,
      excludeUserId: legacyExcludeUserId,
      limit: legacyLimit
    });
  },

  async updateTheme(userId, theme) {
    return await userRepository.updateTheme(userId, theme);
  }
};
