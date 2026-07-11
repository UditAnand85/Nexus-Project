import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function check() {
  try {
    const admins = await sql`SELECT admin_id, email, role_key, must_change_password FROM admin`;
    console.log('ADMINS:', admins);
    const users = await sql`SELECT user_id, email, full_name FROM users`;
    console.log('USERS:', users);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    sql.end();
  }
}
check();
