import { PrismaClient } from '@prisma/client';
import { ENV } from './env.js';

// Global singleton for PrismaClient to prevent connection pool exhaustion
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ENV.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1 as connected`;
    console.log(`[DB] Successfully connected to Supabase PostgreSQL via Prisma ORM.`);
    return true;
  } catch (err) {
    console.log(`[DB Notice] Supabase PostgreSQL not reached (${err.message.split('\n')[0]}).`);
    console.log(`[DB Notice] Add your Supabase credentials in backend/.env to connect live.`);
    return false;
  }
};
