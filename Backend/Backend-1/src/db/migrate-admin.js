import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

try {
  await sql`ALTER TABLE admin ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false NOT NULL`;
  await sql`ALTER TABLE admin ADD COLUMN IF NOT EXISTS department varchar(100)`;
  await sql`ALTER TABLE admin ADD COLUMN IF NOT EXISTS phone varchar(20)`;
  console.log('✅ Columns added successfully.');
} catch (e) {
  console.error('❌ Error:', e.message);
} finally {
  await sql.end();
  process.exit(0);
}
