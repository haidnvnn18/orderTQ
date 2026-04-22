import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('Đang cấu hình Storage RLS Policies trên Supabase...');
    
    await prisma.$executeRawUnsafe(`
      -- Đảm bảo bucket là public
      UPDATE storage.buckets SET public = true WHERE id = 'image demo';
    `);
    
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "allow_public_insert" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "allow_public_select" ON storage.objects;
    `);
    await prisma.$executeRawUnsafe(`
      DROP POLICY IF EXISTS "allow_public_delete" ON storage.objects;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "allow_public_insert" ON storage.objects
        FOR INSERT TO anon
        WITH CHECK (bucket_id = 'image demo');
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "allow_public_select" ON storage.objects
        FOR SELECT TO anon
        USING (bucket_id = 'image demo');
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "allow_public_delete" ON storage.objects
        FOR DELETE TO anon
        USING (bucket_id = 'image demo');
    `);

    console.log('✅ Đã cấu hình xong quyền Upload/Download cho bucket "image demo"!');
  } catch (e) {
    console.error('❌ Lỗi:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
