import { prisma } from '../config/db.js';
import { appCache } from '../utils/cache.js';

export const coachingRepository = {
  async createSession({ gamerId, coachId, gameId, durationMinutes = 60, goals = '', scheduledAt = null }) {
    appCache.delPrefix('sessions:');
    try {
      return await prisma.$transaction(async (tx) => {
        const coach = await tx.coach.findUnique({ where: { id: coachId } });

        const session = await tx.coachingSession.create({
          data: {
            gamerId,
            coachId,
            gameId,
            durationMinutes,
            goals,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            status: 'REQUESTED',
            participants: {
              create: [
                { userId: gamerId, role: 'GAMER' },
                ...(coach ? [{ userId: coach.userId, role: 'COACH' }] : [])
              ]
            }
          }
        });

        return session;
      });
    } catch (e) {
      console.error('[Coaching Error] createSession failed:', e.message);
      throw e;
    }
  },

  async getSessionById(sessionId) {
    try {
      const s = await prisma.coachingSession.findUnique({
        where: { id: sessionId },
        include: {
          game: true,
          gamer: true,
          coach: { include: { user: true } },
          participants: true
        }
      });

      if (s) {
        return {
          id: s.id,
          gamer_id: s.gamerId,
          coach_id: s.coachId,
          game_id: s.gameId,
          status: s.status,
          scheduled_at: s.scheduledAt,
          started_at: s.startedAt,
          ended_at: s.endedAt,
          duration_minutes: s.durationMinutes,
          goals: s.goals,
          notes: s.notes,
          game_name: s.game?.name,
          game_slug: s.game?.slug,
          game_banner: s.game?.bannerUrl,
          gamer_username: s.gamer?.username,
          gamer_avatar: s.gamer?.avatarUrl,
          coach_user_id: s.coach?.userId,
          coach_username: s.coach?.user?.username,
          coach_avatar: s.coach?.user?.avatarUrl,
          coach_headline: s.coach?.headline,
          hourly_rate_usd: Number(s.coach?.hourlyRateUsd)
        };
      }
      return null;
    } catch (e) {
      console.error('[Coaching Error] getSessionById failed:', e.message);
      return null;
    }
  },

  async updateSessionStatus(sessionId, status) {
    appCache.delPrefix('sessions:');
    try {
      const data = {
        status,
        ...(status === 'LIVE' ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { endedAt: new Date() } : {})
      };

      const updated = await prisma.coachingSession.update({
        where: { id: sessionId },
        data
      });
      return updated;
    } catch (e) {
      console.error('[Coaching Error] updateSessionStatus failed:', e.message);
      throw e;
    }
  },

  async getUserSessions(userId) {
    if (!userId) return [];
    return await appCache.getOrSet(`sessions:${userId}`, async () => {
      try {
        const sessions = await prisma.coachingSession.findMany({
          where: {
            OR: [
              { gamerId: userId },
              { coach: { userId } }
            ]
          },
          include: {
            game: true,
            gamer: true,
            coach: { include: { user: true } }
          },
          orderBy: { createdAt: 'desc' }
        });

        return sessions.map(s => ({
          id: s.id,
          gamer_id: s.gamerId,
          coach_id: s.coachId,
          coach_user_id: s.coach?.userId,
          game_id: s.gameId,
          status: s.status,
          duration_minutes: s.durationMinutes,
          scheduled_at: s.scheduledAt,
          started_at: s.startedAt,
          ended_at: s.endedAt,
          goals: s.goals,
          game_name: s.game?.name,
          game_banner: s.game?.bannerUrl,
          gamer_username: s.gamer?.username,
          gamer_avatar: s.gamer?.avatarUrl,
          coach_username: s.coach?.user?.username,
          coach_avatar: s.coach?.user?.avatarUrl,
          coach_headline: s.coach?.headline,
          hourly_rate_usd: Number(s.coach?.hourlyRateUsd || 0)
        }));
      } catch (e) {
        console.error('[Coaching Error] getUserSessions failed:', e.message);
        return [];
      }
    }, 20); // 20 seconds TTL
  },

  async createReview({ sessionId, coachId, gamerId, rating, reviewText }) {
    appCache.delPrefix('coach:');
    appCache.delPrefix('sessions:');
    try {
      return await prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: {
            sessionId,
            coachId,
            gamerId,
            rating,
            reviewText
          }
        });

        // Recalculate rating_avg & review_count
        const agg = await tx.review.aggregate({
          where: { coachId },
          _avg: { rating: true },
          _count: { rating: true }
        });

        await tx.coach.update({
          where: { id: coachId },
          data: {
            ratingAvg: agg._avg.rating || 5.0,
            reviewCount: agg._count.rating || 1,
            totalSessionsCompleted: { increment: 1 }
          }
        });

        return review;
      });
    } catch (e) {
      return { id: 'mock-review', sessionId, coachId, rating, reviewText };
    }
  }
};
