import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Prisma v7: Engine type "client" yêu cầu database adapter
// Sử dụng @prisma/adapter-pg để kết nối PostgreSQL (Supabase)
//
// QUAN TRỌNG cho Vercel + Supabase Pooler (Transaction Mode, port 6543):
// - Phải dùng pg.Pool và tắt prepared statements (không tương thích PgBouncer)
// - Giới hạn pool size cho serverless environment

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString,
    max: 5 // Serverless: giữ pool nhỏ, tránh cạn kiệt connection
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
