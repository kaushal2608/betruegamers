import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function restoreData() {
  const backupPath = path.join(__dirname, 'backup_data.json');
  if (!fs.existsSync(backupPath)) {
    console.error('Backup file not found at:', backupPath);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log('Restoring data from backup generated at:', data.timestamp);

  // 1. Restore Games
  if (data.games?.length) {
    console.log(`Restoring ${data.games.length} games...`);
    for (const g of data.games) {
      await prisma.game.upsert({
        where: { id: g.id },
        update: {},
        create: {
          id: g.id,
          name: g.name,
          slug: g.slug,
          genre: g.genre,
          description: g.description,
          platforms: g.platforms || [],
          bannerUrl: g.bannerUrl,
          iconUrl: g.iconUrl,
          activePlayersCount: g.activePlayersCount || 0,
          isActive: g.isActive
        }
      });
    }
  }

  // 2. Restore Users & Profiles
  if (data.users?.length) {
    console.log(`Restoring ${data.users.length} users...`);
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          username: u.username,
          passwordHash: u.passwordHash,
          role: u.role,
          isVerified: u.isVerified,
          isActive: u.isActive,
          isBlocked: u.isBlocked,
          avatarUrl: u.avatarUrl,
          bannerUrl: u.bannerUrl,
          lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
          createdAt: new Date(u.createdAt)
        }
      });

      if (u.profile) {
        await prisma.userProfile.upsert({
          where: { userId: u.id },
          update: {},
          create: {
            id: u.profile.id,
            userId: u.id,
            fullName: u.profile.fullName,
            bio: u.profile.bio,
            discordTag: u.profile.discordTag,
            steamId: u.profile.steamId,
            riotId: u.profile.riotId,
            country: u.profile.country || 'Global',
            experienceLevel: u.profile.experienceLevel || 'Intermediate',
            preferredLanguage: u.profile.preferredLanguage || 'English',
            achievements: u.profile.achievements || []
          }
        });
      }
    }
  }

  // 3. Restore Coaches & CoachGames
  if (data.coaches?.length) {
    console.log(`Restoring ${data.coaches.length} coaches...`);
    for (const c of data.coaches) {
      await prisma.coach.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          userId: c.userId,
          headline: c.headline,
          bio: c.bio,
          coachingExperienceYears: c.coachingExperienceYears || 0,
          hourlyRateUsd: c.hourlyRateUsd || 25,
          isVerified: c.isVerified,
          isAvailable: c.isAvailable,
          ratingAvg: c.ratingAvg || 5.0,
          reviewCount: c.reviewCount || 0,
          totalSessionsCompleted: c.totalSessionsCompleted || 0
        }
      });

      if (c.coachGames?.length) {
        for (const cg of c.coachGames) {
          await prisma.coachGame.upsert({
            where: { coachId_gameId: { coachId: c.id, gameId: cg.gameId } },
            update: {},
            create: {
              id: cg.id,
              coachId: c.id,
              gameId: cg.gameId,
              highestRank: cg.highestRank,
              specialization: cg.specialization,
              sessionDurationMinutes: cg.sessionDurationMinutes || 60
            }
          });
        }
      }
    }
  }

  // 4. Restore UserGames
  if (data.userGames?.length) {
    console.log(`Restoring ${data.userGames.length} user games...`);
    for (const ug of data.userGames) {
      await prisma.userGame.upsert({
        where: { userId_gameId: { userId: ug.userId, gameId: ug.gameId } },
        update: {},
        create: {
          id: ug.id,
          userId: ug.userId,
          gameId: ug.gameId,
          inGameRank: ug.inGameRank,
          mainRole: ug.mainRole,
          hoursPlayed: ug.hoursPlayed || 0,
          isFavorite: ug.isFavorite
        }
      });
    }
  }

  // 5. Restore Friendships & Requests
  if (data.friendRequests?.length) {
    console.log(`Restoring ${data.friendRequests.length} friend requests...`);
    for (const fr of data.friendRequests) {
      await prisma.friendRequest.upsert({
        where: { id: fr.id },
        update: {},
        create: {
          id: fr.id,
          senderId: fr.senderId,
          receiverId: fr.receiverId,
          status: fr.status,
          createdAt: new Date(fr.createdAt)
        }
      });
    }
  }

  if (data.friendships?.length) {
    console.log(`Restoring ${data.friendships.length} friendships...`);
    for (const f of data.friendships) {
      await prisma.friendship.upsert({
        where: { id: f.id },
        update: {},
        create: {
          id: f.id,
          userId1: f.userId1,
          userId2: f.userId2,
          createdAt: new Date(f.createdAt)
        }
      });
    }
  }

  // 6. Restore Conversations & Messages
  if (data.conversations?.length) {
    console.log(`Restoring ${data.conversations.length} conversations...`);
    for (const conv of data.conversations) {
      await prisma.conversation.upsert({
        where: { id: conv.id },
        update: {},
        create: {
          id: conv.id,
          title: conv.title,
          isGroup: Boolean(conv.isGroup),
          lastMessageAt: new Date(conv.lastMessageAt || conv.createdAt),
          createdAt: new Date(conv.createdAt)
        }
      });

      if (conv.members?.length) {
        for (const m of conv.members) {
          await prisma.conversationMember.upsert({
            where: { conversationId_userId: { conversationId: conv.id, userId: m.userId } },
            update: {},
            create: {
              id: m.id,
              conversationId: conv.id,
              userId: m.userId,
              joinedAt: new Date(m.joinedAt),
              lastReadAt: new Date(m.lastReadAt || m.joinedAt)
            }
          });
        }
      }
    }
  }

  if (data.messages?.length) {
    console.log(`Restoring ${data.messages.length} messages...`);
    for (const msg of data.messages) {
      await prisma.message.upsert({
        where: { id: msg.id },
        update: {},
        create: {
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          content: msg.content,
          createdAt: new Date(msg.createdAt)
        }
      });
    }
  }

  // 7. Restore Coaching Sessions
  if (data.coachingSessions?.length) {
    console.log(`Restoring ${data.coachingSessions.length} coaching sessions...`);
    for (const s of data.coachingSessions) {
      await prisma.coachingSession.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          coachId: s.coachId,
          gamerId: s.gamerId,
          gameId: s.gameId,
          status: s.status,
          scheduledAt: s.scheduledAt ? new Date(s.scheduledAt) : null,
          startedAt: s.startedAt ? new Date(s.startedAt) : null,
          endedAt: s.endedAt ? new Date(s.endedAt) : null,
          durationMinutes: s.durationMinutes || 60,
          goals: s.goals,
          notes: s.notes,
          createdAt: new Date(s.createdAt)
        }
      });
    }
  }

  // 8. Restore Notifications
  if (data.notifications?.length) {
    console.log(`Restoring ${data.notifications.length} notifications...`);
    for (const n of data.notifications) {
      await prisma.notification.upsert({
        where: { id: n.id },
        update: {},
        create: {
          id: n.id,
          userId: n.userId,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data || {},
          isRead: Boolean(n.isRead),
          createdAt: new Date(n.createdAt)
        }
      });
    }
  }

  console.log('🎉 ALL DATA RESTORED SUCCESSFULLY INTO NEW DATABASE!');
  await prisma.$disconnect();
}

restoreData().catch(async (e) => {
  console.error('Data restoration error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
