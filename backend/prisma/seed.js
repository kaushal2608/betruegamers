import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_GAMES = [
  {
    name: 'Valorant',
    slug: 'valorant',
    genre: 'Tactical Shooter',
    description: 'A 5v5 character-based tactical FPS where precise gunplay meets unique agent abilities.',
    platforms: ['PC'],
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80',
    activePlayersCount: 2450000
  },
  {
    name: 'Counter-Strike 2',
    slug: 'counter-strike-2',
    genre: 'Competitive FPS',
    description: 'The premier competitive tactical shooter rebuilt from the ground up on the Source 2 engine.',
    platforms: ['PC'],
    bannerUrl: 'https://images.unsplash.com/photo-1552824722-ddab1374e622?auto=format&fit=crop&w=1200&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1552824722-ddab1374e622?auto=format&fit=crop&w=200&q=80',
    activePlayersCount: 1820000
  },
  {
    name: 'Fortnite',
    slug: 'fortnite',
    genre: 'Battle Royale',
    description: 'Drop onto the Island and battle to be the last player or team standing in high-tempo build and no-build action.',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch'],
    bannerUrl: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?auto=format&fit=crop&w=1200&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1589241062272-c0a000072dfa?auto=format&fit=crop&w=200&q=80',
    activePlayersCount: 3100000
  },
  {
    name: 'Apex Legends',
    slug: 'apex-legends',
    genre: 'Hero Shooter / BR',
    description: 'Conquer with character in Apex Legends, a free-to-play Hero shooter where legendary competitors battle for glory.',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch'],
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=200&q=80',
    activePlayersCount: 1200000
  },
  {
    name: 'Grand Theft Auto V',
    slug: 'gta-v',
    genre: 'Action-Adventure / Roleplay',
    description: 'Explore the vast open world of Los Santos, engage in high-stakes heists, and participate in competitive RP communities.',
    platforms: ['PC', 'PlayStation', 'Xbox'],
    bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=200&q=80',
    activePlayersCount: 950000
  },
  {
    name: 'Minecraft',
    slug: 'minecraft',
    genre: 'Sandbox / Survival',
    description: 'Build, survive, compete in PvP mini-games, and conquer endless worlds with infinite possibilities.',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'],
    bannerUrl: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=200&q=80',
    activePlayersCount: 4000000
  }
];

async function main() {
  console.log('[Prisma Seed] Seeding Supabase PostgreSQL database...');

  // 1. Seed Games
  const gameMap = {};
  for (const game of SEED_GAMES) {
    const created = await prisma.game.upsert({
      where: { slug: game.slug },
      update: game,
      create: game
    });
    gameMap[game.slug] = created.id;
  }
  console.log(`[Prisma Seed] Seeded ${Object.keys(gameMap).length} games.`);

  const hashedPassword = await bcrypt.hash('GamingPassword123!', 10);

  // 2. Seed Admin User
  await prisma.user.upsert({
    where: { email: 'admin@betruegamers.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@betruegamers.com',
      username: 'BeTrueAdmin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
      profile: {
        create: {
          fullName: 'BeTrueGamers Master Admin',
          bio: 'Platform administrator & esports director',
          experienceLevel: 'Pro'
        }
      }
    }
  });

  // 3. Seed Coach Alex (Valorant)
  const coachAlex = await prisma.user.upsert({
    where: { email: 'coach.alex@betruegamers.com' },
    update: { role: 'COACH' },
    create: {
      email: 'coach.alex@betruegamers.com',
      username: 'CoachAlex',
      passwordHash: hashedPassword,
      role: 'COACH',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      profile: {
        create: {
          fullName: 'Alex Mercer',
          bio: 'Radiant tier Valorant coach specializing in tactical macro and duel mechanics.',
          discordTag: 'AlexM#1337',
          riotId: 'Alex#EUW',
          experienceLevel: 'Pro'
        }
      },
      coach: {
        create: {
          headline: 'Radiant #24 Peak | Pro VCT Analyst & Aim Coach',
          bio: 'I have coached over 200+ students from Silver to Immortal. My sessions focus on screen-recorded VOD review, live gameplay screen-share coaching, crosshair discipline, and clutch mindset.',
          coachingExperienceYears: 5,
          hourlyRateUsd: 35.00,
          isVerified: true,
          isAvailable: true,
          ratingAvg: 4.95,
          reviewCount: 48,
          totalSessionsCompleted: 156,
          coachGames: {
            create: [
              {
                gameId: gameMap['valorant'],
                highestRank: 'Radiant',
                specialization: 'Duelist / Crosshair Placement / VOD Review',
                sessionDurationMinutes: 60
              }
            ]
          }
        }
      }
    }
  });

  // 4. Seed Coach Sarah (CS2)
  await prisma.user.upsert({
    where: { email: 'coach.sarah@betruegamers.com' },
    update: { role: 'COACH' },
    create: {
      email: 'coach.sarah@betruegamers.com',
      username: 'NeoNova',
      passwordHash: hashedPassword,
      role: 'COACH',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      profile: {
        create: {
          fullName: 'Sarah Vance',
          bio: 'Ex-semi-pro CS:GO/CS2 in-game leader. Master of utility lineups and rotation timing.',
          steamId: 'STEAM_0:1:456789',
          experienceLevel: 'Semi-Pro'
        }
      },
      coach: {
        create: {
          headline: 'Global Elite / Faceit Level 10 | IGL & Utility Master',
          bio: 'Transform your utility usage, map control, and post-plant setups. Screen share sessions with interactive callouts and live feedback.',
          coachingExperienceYears: 4,
          hourlyRateUsd: 30.00,
          isVerified: true,
          isAvailable: true,
          ratingAvg: 4.88,
          reviewCount: 32,
          totalSessionsCompleted: 98,
          coachGames: {
            create: [
              {
                gameId: gameMap['counter-strike-2'],
                highestRank: 'Faceit Lvl 10',
                specialization: 'IGL Tactics / Utility Lineups',
                sessionDurationMinutes: 60
              }
            ]
          }
        }
      }
    }
  });

  console.log('[Prisma Seed] Seed complete!');
}

main()
  .catch((e) => {
    console.error('[Prisma Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
