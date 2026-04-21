// prisma.config.ts — Prisma v7 configuration
// Connection URLs are declared here, NOT in schema.prisma

import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    // Pooled URL — dùng cho query thông thường (PgBouncer của Supabase)
    url: process.env.DATABASE_URL!,
    // Direct URL — dùng riêng cho prisma migrate (không qua PgBouncer)
    // directUrl: process.env.DIRECT_URL,
  }
});
