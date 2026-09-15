import { coachingRepository } from '../repositories/coaching.repository.js';
import { coachRepository } from '../repositories/coach.repository.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { getIO } from '../config/socket.js';

export const coachingService = {
  async requestSession({ gamer, coachId, gameId, durationMinutes, goals, scheduledAt }) {
    const session = await coachingRepository.createSession({
      gamerId: gamer.id,
      coachId,
      gameId,
      durationMinutes,
      goals,
      scheduledAt
    });

    // Notify coach
    const coach = await coachRepository.findById(coachId);
    if (coach && coach.user_id) {
      const formattedDate = scheduledAt ? new Date(scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Flexible';
      const notif = await notificationRepository.createNotification({
        userId: coach.user_id,
        type: 'COACHING_REQUEST',
        title: 'New Coaching Session Request',
        message: `${gamer.username} requested a ${durationMinutes}-min session for ${formattedDate}!`,
        data: { sessionId: session.id, gamerId: gamer.id, scheduledAt }
      });

      try {
        const io = getIO();
        io.to(`user:${coach.user_id}`).emit('notification:new', notif);
        io.to(`user:${coach.user_id}`).emit('coaching:session_requested', { session });
      } catch (e) {}
    }

    return session;
  },

  async getSession(sessionId, userId) {
    const session = await coachingRepository.getSessionById(sessionId);
    if (!session) {
      const error = new Error('Coaching session not found');
      error.statusCode = 404;
      throw error;
    }
    return session;
  },

  async updateStatus(sessionId, userId, status) {
    const session = await coachingRepository.getSessionById(sessionId);
    if (!session) {
      const error = new Error('Coaching session not found');
      error.statusCode = 404;
      throw error;
    }

    // If the session is already in the target status, return early to prevent duplicate notifications
    if (session.status === status) {
      return session;
    }

    const updated = await coachingRepository.updateSessionStatus(sessionId, status);

    // If status is ACCEPTED, notify the gamer
    if (status === 'ACCEPTED' && session.gamer_id) {
      try {
        const notif = await notificationRepository.createNotification({
          userId: session.gamer_id,
          type: 'COACHING_ACCEPTED',
          title: 'Coaching Session Approved!',
          message: `Your coaching session for ${session.game_name || 'your game'} has been approved! You can open the session now.`,
          data: { sessionId: session.id }
        });
        const io = getIO();
        io.to(`user:${session.gamer_id}`).emit('notification:new', notif);
      } catch (e) {}
    } else if (status === 'CANCELLED' && session.gamer_id) {
      try {
        const notif = await notificationRepository.createNotification({
          userId: session.gamer_id,
          type: 'COACHING_CANCELLED',
          title: 'Coaching Session Declined',
          message: `Your coaching session request for ${session.game_name || 'your game'} was declined.`,
          data: { sessionId: session.id }
        });
        const io = getIO();
        io.to(`user:${session.gamer_id}`).emit('notification:new', notif);
      } catch (e) {}
    }

    // Broadcast session status change via Socket.IO
    try {
      const io = getIO();
      const payload = { status, sessionId, session: updated };
      io.to(`session:${sessionId}`).emit('coaching:status_changed', payload);
      // Notify participants directly
      io.to(`user:${session.gamer_id}`).emit('coaching:status_changed', payload);
      if (session.coach_user_id) {
        io.to(`user:${session.coach_user_id}`).emit('coaching:status_changed', payload);
      }
    } catch (e) {}

    return updated;
  },

  async getUserSessions(userId) {
    return await coachingRepository.getUserSessions(userId);
  },

  async submitReview({ sessionId, gamerId, rating, reviewText }) {
    const session = await coachingRepository.getSessionById(sessionId);
    if (!session) {
      const error = new Error('Session not found');
      error.statusCode = 404;
      throw error;
    }

    if (session.gamer_id !== gamerId) {
      const error = new Error('Only the gamer who booked this session can submit a review');
      error.statusCode = 403;
      throw error;
    }

    if (session.status !== 'COMPLETED') {
      const error = new Error('You can only review sessions that have been completed');
      error.statusCode = 400;
      throw error;
    }

    return await coachingRepository.createReview({
      sessionId,
      coachId: session.coach_id,
      gamerId,
      rating,
      reviewText
    });
  }
};
