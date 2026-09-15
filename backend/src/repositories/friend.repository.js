import { prisma } from '../config/db.js';
import { appCache } from '../utils/cache.js';

export const friendRepository = {
  async getFriendship(userId1, userId2) {
    const [u1, u2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    try {
      return await prisma.friendship.findUnique({
        where: { userId1_userId2: { userId1: u1, userId2: u2 } }
      });
    } catch (e) {
      return null;
    }
  },

  async getExistingRequest(senderId, receiverId) {
    try {
      return await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId, receiverId, status: 'PENDING' },
            { senderId: receiverId, receiverId: senderId, status: 'PENDING' }
          ]
        }
      });
    } catch (e) {
      return null;
    }
  },

  async createRequest(senderId, receiverId) {
    appCache.delPrefix('friends:reqs:');
    try {
      return await prisma.friendRequest.upsert({
        where: { senderId_receiverId: { senderId, receiverId } },
        update: { status: 'PENDING' },
        create: { senderId, receiverId, status: 'PENDING' }
      });
    } catch (e) {
      return { id: 'mock-fr-id', sender_id: senderId, receiver_id: receiverId, status: 'PENDING' };
    }
  },

  async getRequestById(requestId) {
    try {
      const r = await prisma.friendRequest.findUnique({ where: { id: requestId } });
      if (!r) return null;
      return {
        id: r.id,
        sender_id: r.senderId,
        receiver_id: r.receiverId,
        status: r.status
      };
    } catch (e) {
      return null;
    }
  },

  async acceptRequest(requestId, senderId, receiverId) {
    appCache.delPrefix('friends:');
    const [u1, u2] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];
    try {
      await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' }
        }),
        prisma.friendship.upsert({
          where: { userId1_userId2: { userId1: u1, userId2: u2 } },
          update: {},
          create: { userId1: u1, userId2: u2 }
        })
      ]);
    } catch (e) {}
  },

  async rejectRequest(requestId) {
    appCache.delPrefix('friends:reqs:');
    try {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });
    } catch (e) {}
  },

  async cancelRequest(identifier, senderId) {
    appCache.delPrefix('friends:reqs:');
    try {
      await prisma.friendRequest.updateMany({
        where: {
          OR: [
            { id: identifier, senderId },
            { senderId, receiverId: identifier, status: 'PENDING' }
          ]
        },
        data: { status: 'CANCELLED' }
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  async removeFriendship(userId1, userId2) {
    appCache.delPrefix('friends:');
    const [u1, u2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    try {
      await prisma.friendship.delete({
        where: { userId1_userId2: { userId1: u1, userId2: u2 } }
      });
    } catch (e) {}
  },

  async getFriendsList(userId) {
    return await appCache.getOrSet(`friends:list:${userId}`, async () => {
      try {
        const friendships = await prisma.friendship.findMany({
          where: {
            OR: [{ userId1: userId }, { userId2: userId }]
          },
          include: {
            user1: { include: { profile: true } },
            user2: { include: { profile: true } }
          }
        });

        return friendships.map((f) => {
          const friend = f.userId1 === userId ? f.user2 : f.user1;
          return {
            id: friend.id,
            username: friend.username,
            email: friend.email,
            avatar_url: friend.avatarUrl,
            role: friend.role,
            experience_level: friend.profile?.experienceLevel || 'Gamer',
            bio: friend.profile?.bio
          };
        });
      } catch (e) {
        console.error('[Friend Error] getFriendsList failed:', e.message);
        return [];
      }
    }, 60);
  },

  async searchFriendsList(userId, query) {
    const q = (query || '').trim();
    if (!q) return [];
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ userId1: userId }, { userId2: userId }],
          AND: [
            {
              OR: [
                { user1: { username: { contains: q, mode: 'insensitive' } } },
                { user2: { username: { contains: q, mode: 'insensitive' } } }
              ]
            }
          ]
        },
        include: {
          user1: { include: { profile: true } },
          user2: { include: { profile: true } }
        }
      });

      return friendships.map((f) => {
        const friend = f.userId1 === userId ? f.user2 : f.user1;
        return {
          id: friend.id,
          username: friend.username,
          email: friend.email,
          avatar_url: friend.avatarUrl,
          role: friend.role,
          experience_level: friend.profile?.experienceLevel || 'Gamer',
          bio: friend.profile?.bio
        };
      });
    } catch (e) {
      console.error('[Friend Error] searchFriendsList failed:', e.message);
      return [];
    }
  },

  async getPendingRequests(userId) {
    return await appCache.getOrSet(`friends:reqs:${userId}`, async () => {
      try {
        const incoming = await prisma.friendRequest.findMany({
          where: { receiverId: userId, status: 'PENDING' },
          include: { sender: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' }
        });

        const outgoing = await prisma.friendRequest.findMany({
          where: { senderId: userId, status: 'PENDING' },
          include: { receiver: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' }
        });

        return {
          incoming: incoming.map(r => ({
            id: r.id,
            sender_id: r.senderId,
            created_at: r.createdAt,
            username: r.sender.username,
            avatar_url: r.sender.avatarUrl,
            role: r.sender.role,
            experience_level: r.sender.profile?.experienceLevel
          })),
          outgoing: outgoing.map(r => ({
            id: r.id,
            receiver_id: r.receiverId,
            created_at: r.createdAt,
            username: r.receiver.username,
            avatar_url: r.receiver.avatarUrl,
            role: r.receiver.role,
            experience_level: r.receiver.profile?.experienceLevel
          }))
        };
      } catch (e) {
        return { incoming: [], outgoing: [] };
      }
    }, 30);
  }
};
