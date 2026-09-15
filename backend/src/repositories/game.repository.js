import { prisma } from '../config/db.js';
import { appCache } from '../utils/cache.js';

const FALLBACK_GAMES = [
  { id: 'g1', name: 'Valorant', slug: 'valorant', genre: 'Tactical Shooter', description: '5v5 character-based tactical shooter where precise gunplay meets unique agent abilities.', platforms: ['PC'], banner_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80', icon_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80', active_players_count: 2450000, is_active: true },
  { id: 'g2', name: 'Counter-Strike 2', slug: 'counter-strike-2', genre: 'Competitive FPS', description: 'The premier competitive tactical shooter rebuilt from the ground up on Source 2.', platforms: ['PC'], banner_url: 'https://images.unsplash.com/photo-1552824722-ddab1374e622?auto=format&fit=crop&w=1200&q=80', icon_url: 'https://images.unsplash.com/photo-1552824722-ddab1374e622?auto=format&fit=crop&w=200&q=80', active_players_count: 1820000, is_active: true },
  { id: 'g3', name: 'Fortnite', slug: 'fortnite', genre: 'Battle Royale', description: 'Drop onto the Island and battle to be the last player or team standing in high-tempo build and no-build action.', platforms: ['PC', 'PlayStation', 'Xbox'], banner_url: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?auto=format&fit=crop&w=1200&q=80', icon_url: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?auto=format&fit=crop&w=200&q=80', active_players_count: 3100000, is_active: true },
  { id: 'g4', name: 'Apex Legends', slug: 'apex-legends', genre: 'Hero Shooter / BR', description: 'Conquer with character in Apex Legends, a free-to-play Hero shooter where competitors battle for glory.', platforms: ['PC', 'PlayStation', 'Xbox'], banner_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80', icon_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=200&q=80', active_players_count: 1200000, is_active: true },
  { id: 'g5', name: 'Grand Theft Auto V', slug: 'gta-v', genre: 'Action-Adventure / Roleplay', description: 'Explore Los Santos, execute heists, and participate in competitive RP communities.', platforms: ['PC', 'PlayStation', 'Xbox'], banner_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80', icon_url: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=200&q=80', active_players_count: 950000, is_active: true },
  { id: 'g6', name: 'Minecraft', slug: 'minecraft', genre: 'Sandbox / Survival', description: 'Build, survive, compete in PvP mini-games, and conquer endless worlds with infinite possibilities.', platforms: ['PC', 'PlayStation', 'Xbox', 'Switch'], banner_url: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80', icon_url: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=200&q=80', active_players_count: 4000000, is_active: true }
];

export const gameRepository = {
  async findAll({ search, genre, limit = 50, offset = 0 } = {}) {
    const cacheKey = `games:${search || ''}:${genre || ''}:${limit}:${offset}`;
    return await appCache.getOrSet(cacheKey, async () => {
      try {
        const where = {
          isActive: true,
          ...(search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          } : {}),
          ...(genre && genre !== 'All' ? { genre: { equals: genre, mode: 'insensitive' } } : {})
        };

        const games = await prisma.game.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { activePlayersCount: 'desc' }
        });

        if (games && games.length > 0) {
          return games.map(g => ({
            ...g,
            banner_url: g.bannerUrl,
            icon_url: g.iconUrl,
            active_players_count: g.activePlayersCount
          }));
        }
        return FALLBACK_GAMES;
      } catch (e) {
        return FALLBACK_GAMES;
      }
    }, 180); // 3 minutes TTL
  },

  async findBySlug(slug) {
    return await appCache.getOrSet(`game:slug:${slug}`, async () => {
      try {
        const game = await prisma.game.findUnique({
          where: { slug }
        });
        if (game) {
          return {
            ...game,
            banner_url: game.bannerUrl,
            icon_url: game.iconUrl,
            active_players_count: game.activePlayersCount
          };
        }
        const fallback = FALLBACK_GAMES.find(g => g.slug === slug);
        return fallback || null;
      } catch (e) {
        return FALLBACK_GAMES.find(g => g.slug === slug) || null;
      }
    }, 300);
  },

  async findById(id) {
    return await appCache.getOrSet(`game:id:${id}`, async () => {
      try {
        const game = await prisma.game.findUnique({ where: { id } });
        if (game) {
          return {
            ...game,
            banner_url: game.bannerUrl,
            icon_url: game.iconUrl,
            active_players_count: game.activePlayersCount
          };
        }
        return FALLBACK_GAMES.find(g => g.id === id) || null;
      } catch (e) {
        return FALLBACK_GAMES.find(g => g.id === id) || null;
      }
    }, 300);
  },

  async createGame({ name, slug, description, genre, platforms, banner_url, icon_url }) {
    try {
      const game = await prisma.game.create({
        data: {
          name,
          slug,
          description,
          genre,
          platforms: platforms || ['PC'],
          bannerUrl: banner_url,
          iconUrl: icon_url
        }
      });
      return game;
    } catch (e) {
      return { id: 'new-game', name, slug, description, genre, platforms };
    }
  },

  async getUserGames(userId) {
    if (!userId) return [];
    return await appCache.getOrSet(`user_games:${userId}`, async () => {
      try {
        const userGames = await prisma.userGame.findMany({
          where: { userId },
          include: { game: true },
          orderBy: [{ isFavorite: 'desc' }, { hoursPlayed: 'desc' }]
        });

        return userGames.map(ug => ({
          id: ug.id,
          user_id: ug.userId,
          game_id: ug.gameId,
          in_game_rank: ug.inGameRank,
          mainRole: ug.mainRole,
          hours_played: ug.hoursPlayed,
          is_favorite: ug.isFavorite,
          game_name: ug.game?.name,
          game_slug: ug.game?.slug,
          genre: ug.game?.genre,
          banner_url: ug.game?.bannerUrl,
          icon_url: ug.game?.iconUrl
        }));
      } catch (e) {
        return [
          { id: 'ug1', game_id: 'g1', game_name: 'Valorant', in_game_rank: 'Ascendant 2', main_role: 'Initiator (Sova/Fade)', hours_played: 450, is_favorite: true }
        ];
      }
    }, 60);
  },

  async addUserGame({ userId, gameId, inGameRank, mainRole, hoursPlayed, isFavorite }) {
    appCache.delPrefix('user_games:');
    try {
      return await prisma.userGame.upsert({
        where: { userId_gameId: { userId, gameId } },
        update: {
          inGameRank: inGameRank || 'Unranked',
          mainRole: mainRole || 'All-Rounder',
          hoursPlayed: hoursPlayed || 0,
          isFavorite: isFavorite || false
        },
        create: {
          userId,
          gameId,
          inGameRank: inGameRank || 'Unranked',
          mainRole: mainRole || 'All-Rounder',
          hoursPlayed: hoursPlayed || 0,
          isFavorite: isFavorite || false
        }
      });
    } catch (e) {
      return { id: 'mock-user-game', userId, gameId, in_game_rank: inGameRank };
    }
  },

  async removeUserGame(userId, gameId) {
    appCache.delPrefix('user_games:');
    try {
      await prisma.userGame.delete({
        where: { userId_gameId: { userId, gameId } }
      });
    } catch (e) {}
  }
};
