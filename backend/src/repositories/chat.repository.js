import { prisma } from '../config/db.js';
import { appCache } from '../utils/cache.js';

export const chatRepository = {
  async findDirectConversation(userId1, userId2) {
    try {
      const conv = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: userId1 } } },
            { members: { some: { userId: userId2 } } }
          ]
        },
        include: {
          members: {
            include: { user: true }
          }
        },
        orderBy: { lastMessageAt: 'desc' }
      });
      return conv;
    } catch (e) {
      return null;
    }
  },

  async createDirectConversation(userId1, userId2) {
    try {
      return await prisma.conversation.create({
        data: {
          isGroup: false,
          members: {
            create: [
              { userId: userId1 },
              { userId: userId2 }
            ]
          }
        },
        include: {
          members: {
            include: { user: true }
          }
        }
      });
    } catch (e) {
      console.error('[Chat Error] createDirectConversation failed:', e.message);
      throw e;
    }
  },

  async getUserConversations(userId) {
    if (!userId) return [];
    return await appCache.getOrSet(`convs:${userId}`, async () => {
      try {
        const convs = await prisma.conversation.findMany({
          where: {
            members: { some: { userId } },
            messages: { some: {} }
          },
          include: {
            members: {
              include: { user: true }
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { lastMessageAt: 'desc' }
        });

        const convResults = await Promise.all(
          convs.map(async (c) => {
            const myMember = c.members.find((m) => m.userId === userId);
            const otherMember = c.members.find((m) => m.userId !== userId)?.user;
            const lastMsg = c.messages[0];
            const lastReadAt = myMember?.lastReadAt ? new Date(myMember.lastReadAt).getTime() : 0;

            let unreadCount = 0;
            // Only query DB for count if the last message was sent by the other user and is newer than lastReadAt
            if (lastMsg && lastMsg.senderId !== userId && new Date(lastMsg.createdAt).getTime() > lastReadAt) {
              try {
                unreadCount = await prisma.message.count({
                  where: {
                    conversationId: c.id,
                    senderId: { not: userId },
                    createdAt: { gt: myMember?.lastReadAt || new Date(0) }
                  }
                });
              } catch (err) {
                unreadCount = 0;
              }
            }

            return {
              id: c.id,
              is_group: c.isGroup,
              last_message_at: c.lastMessageAt,
              participant_id: otherMember?.id,
              participant_name: otherMember?.username || 'Gamer',
              participant_avatar: otherMember?.avatarUrl,
              participant_role: otherMember?.role,
              last_message_content: lastMsg?.content,
              last_message_time: lastMsg?.createdAt,
              last_message_sender_id: lastMsg?.senderId,
              unread_count: unreadCount
            };
          })
        );

        return convResults;
      } catch (e) {
        console.error('[Chat Error] getUserConversations failed:', e.message);
        return [];
      }
    }, 180); // 180 seconds TTL (auto-invalidated on message events)
  },

  async markConversationAsRead(conversationId, userId) {
    try {
      const readTimestamp = new Date(Date.now() + 2000);
      await prisma.conversationMember.updateMany({
        where: {
          conversationId,
          userId
        },
        data: {
          lastReadAt: readTimestamp
        }
      });
      // Invalidate cache AFTER updating DB so stale unread counts are never cached
      await appCache.del(`convs:${userId}`);
      await appCache.delPrefix('convs:');
      return true;
    } catch (e) {
      return false;
    }
  },

  async getMessages(conversationId, limit = 10, offset = 0) {
    try {
      const take = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
      const skip = Math.max(parseInt(offset, 10) || 0, 0);

      const [total, rawMessages] = await Promise.all([
        prisma.message.count({ where: { conversationId } }),
        prisma.message.findMany({
          where: { conversationId },
          include: { sender: true },
          take,
          skip,
          orderBy: { createdAt: 'desc' }
        })
      ]);

      // Reverse so messages are returned in chronological order (oldest to newest in this slice)
      const messages = [...rawMessages].reverse().map(m => ({
        id: m.id,
        conversation_id: m.conversationId,
        sender_id: m.senderId,
        content: m.content,
        created_at: m.createdAt,
        sender_username: m.sender?.username,
        sender_avatar: m.sender?.avatarUrl
      }));

      return {
        messages,
        total,
        limit: take,
        offset: skip,
        has_more: skip + rawMessages.length < total
      };
    } catch (e) {
      console.error('[Chat Error] getConversationMessages failed:', e.message);
      return {
        messages: [],
        total: 0,
        limit,
        offset,
        has_more: false
      };
    }
  },

  async saveMessage({ conversationId, senderId, content }) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const msg = await tx.message.create({
          data: {
            conversationId,
            senderId,
            content
          },
          include: { sender: true }
        });

        await tx.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() }
        });

        // Automatically update sender's own lastReadAt so their unread count stays 0
        await tx.conversationMember.updateMany({
          where: {
            conversationId,
            userId: senderId
          },
          data: {
            lastReadAt: new Date(Date.now() + 2000)
          }
        });

        return {
          id: msg.id,
          conversation_id: msg.conversationId,
          sender_id: msg.senderId,
          content: msg.content,
          created_at: msg.createdAt,
          sender_username: msg.sender?.username,
          sender_avatar: msg.sender?.avatarUrl
        };
      });

      // Invalidate cache AFTER transaction commits
      await appCache.delPrefix('convs:');
      return result;
    } catch (e) {
      return {
        id: 'msg-' + Date.now(),
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        created_at: new Date()
      };
    }
  },

  async isUserInConversation(conversationId, userId) {
    try {
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId } }
      });
      return !!member;
    } catch (e) {
      return true;
    }
  },

  async getOtherMemberInDirectConversation(conversationId, currentUserId) {
    try {
      const other = await prisma.conversationMember.findFirst({
        where: { conversationId, userId: { not: currentUserId } }
      });
      return other?.userId || null;
    } catch (e) {
      return null;
    }
  }
};
