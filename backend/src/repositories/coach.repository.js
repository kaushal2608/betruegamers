import { prisma } from '../config/db.js';
import { appCache } from '../utils/cache.js';


export const coachRepository = {
  async findAll({ search, game, rank, experience, rating, limit = 50, offset = 0, excludeUserId } = {}) {
    const q = (search || '').trim();
    const cacheKey = `coaches:${q}:${game || ''}:${rank || ''}:${experience || ''}:${rating || ''}:${limit}:${offset}:${excludeUserId || ''}`;
    return await appCache.getOrSet(cacheKey, async () => {
      try {
        // Auto-heal any users with COACH role missing coach profiles
        const unsynced = await prisma.user.findMany({
          where: { role: 'COACH', coach: null },
          include: { profile: true, userGames: { include: { game: true } } }
        });
        if (unsynced.length > 0) {
          const firstGame = await prisma.game.findFirst();
          for (const u of unsynced) {
            const primary = u.userGames?.[0];
            const targetGameId = primary?.gameId || firstGame?.id;
            await prisma.coach.create({
              data: {
                userId: u.id,
                headline: `${u.username} • Verified Esports Coach`,
                bio: u.profile?.bio || 'Professional competitive coach available for 1-on-1 strategy sessions and VOD reviews.',
                coachingExperienceYears: 2,
                hourlyRateUsd: 25.00,
                languages: ['English'],
                isVerified: true,
                isAvailable: true,
                ratingAvg: 5.00,
                reviewCount: 0,
                totalSessionsCompleted: 0,
                ...(targetGameId ? {
                  coachGames: {
                    create: {
                      gameId: targetGameId,
                      highestRank: primary?.inGameRank || 'Diamond / Master',
                      specialization: primary?.mainRole || 'Tactics & Aim',
                      sessionDurationMinutes: 60
                    }
                  }
                } : {})
              }
            });
          }
        }

        const coaches = await prisma.coach.findMany({
          where: {
            isAvailable: true,
            user: {
              role: 'COACH',
              isActive: true,
              isBlocked: false,
              ...(excludeUserId ? { id: { not: excludeUserId } } : {})
            },
            ...(experience ? { coachingExperienceYears: { gte: parseInt(experience, 10) } } : {}),
            ...(rating ? { ratingAvg: { gte: parseFloat(rating) } } : {}),
            ...(q ? {
              OR: [
                { user: { username: { contains: q, mode: 'insensitive' } } },
                { headline: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } },
                { coachGames: { some: { game: { name: { contains: q, mode: 'insensitive' } } } } },
                { coachGames: { some: { highestRank: { contains: q, mode: 'insensitive' } } } },
                { coachGames: { some: { specialization: { contains: q, mode: 'insensitive' } } } }
              ]
            } : {}),
            ...(game ? {
              coachGames: {
                some: {
                  game: {
                    OR: [
                      { name: { contains: game, mode: 'insensitive' } },
                      { slug: { contains: game, mode: 'insensitive' } }
                    ]
                  }
                }
              }
            } : {}),
            ...(rank ? {
              coachGames: {
                some: {
                  highestRank: { contains: rank, mode: 'insensitive' }
                }
              }
            } : {})
          },
          include: {
            user: true,
            coachGames: { include: { game: true } }
          },
          take: limit,
          skip: offset,
          orderBy: [{ ratingAvg: 'desc' }, { totalSessionsCompleted: 'desc' }]
        });

        if (coaches && coaches.length > 0) {
          return coaches.map((c) => ({
            id: c.id,
            user_id: c.userId,
            username: c.user?.username,
            avatar_url: c.user?.avatarUrl,
            headline: c.headline,
            bio: c.bio,
            coaching_experience_years: c.coachingExperienceYears,
            hourly_rate_usd: Number(c.hourlyRateUsd),
            rating_avg: Number(c.ratingAvg),
            review_count: c.reviewCount,
            total_sessions_completed: c.totalSessionsCompleted,
            game_name: c.coachGames[0]?.game?.name || 'Multi-Game',
            highest_rank: c.coachGames[0]?.highestRank,
            specialization: c.coachGames[0]?.specialization,
            session_duration_minutes: c.coachGames[0]?.sessionDurationMinutes || 60,
            games: c.coachGames.map((cg) => ({
              game_id: cg.gameId,
              game_name: cg.game?.name,
              highest_rank: cg.highestRank,
              specialization: cg.specialization
            }))
          }));
        }
        return [];
      } catch (e) {
        return [];
      }
    }, 45); // 45 seconds TTL
  },

  async findById(coachId) {
    if (!coachId) return FALLBACK_COACHES[0];
    return await appCache.getOrSet(`coach:${coachId}`, async () => {
      try {
        const coach = await prisma.coach.findUnique({
          where: { id: coachId },
          include: {
            user: { include: { profile: true } },
            coachGames: { include: { game: true } },
            reviews: {
              include: { gamer: true },
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          }
        });

        if (coach && coach.isAvailable && coach.user?.role === 'COACH') {
          return {
            id: coach.id,
            user_id: coach.userId,
            username: coach.user?.username,
            avatar_url: coach.user?.avatarUrl,
            banner_url: coach.user?.bannerUrl,
            headline: coach.headline,
            bio: coach.bio,
            coaching_experience_years: coach.coachingExperienceYears,
            hourly_rate_usd: Number(coach.hourlyRateUsd),
            rating_avg: Number(coach.ratingAvg),
            review_count: coach.reviewCount,
            total_sessions_completed: coach.totalSessionsCompleted,
            is_verified: coach.isVerified,
            discord_tag: coach.user?.profile?.discordTag,
            steam_id: coach.user?.profile?.steamId,
            riot_id: coach.user?.profile?.riotId,
            country: coach.user?.profile?.country,
            games: coach.coachGames.map(cg => ({
              id: cg.id,
              game_id: cg.gameId,
              game_name: cg.game?.name,
              game_slug: cg.game?.slug,
              highest_rank: cg.highestRank,
              specialization: cg.specialization,
              session_duration_minutes: cg.sessionDurationMinutes
            })),
            reviews: coach.reviews.map(r => ({
              id: r.id,
              rating: r.rating,
              review_text: r.reviewText,
              gamer_username: r.gamer?.username,
              gamer_avatar: r.gamer?.avatarUrl
            }))
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    }, 60); // 60 seconds TTL
  },

  async findByUserId(userId) {
    try {
      return await prisma.coach.findUnique({ where: { userId } });
    } catch (e) {
      return null;
    }
  }
};
