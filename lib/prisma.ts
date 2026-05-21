import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Fallback to dummy connection string during static build compilation if env is not loaded
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

// Shared pool config — keep connections low to avoid exhausting Supabase's session-mode pool (limit: 15)
const poolConfig: pg.PoolConfig = {
  connectionString,
  max: 3,                  // max 3 simultaneous DB connections
  idleTimeoutMillis: 10000, // release idle connections after 10s
  connectionTimeoutMillis: 5000,
};

let prismaInstance: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const pool = new pg.Pool(poolConfig);
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({
    adapter,
    log: ['error'],
  });
} else {
  if (!globalForPrisma.prisma) {
    const pool = new pg.Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: ['error'],
    });
  }
  prismaInstance = globalForPrisma.prisma;
}

export const prisma = prismaInstance;

