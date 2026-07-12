import postgres from 'postgres';
const sql = postgres('postgresql://postgres.wnndbdaystexaziuwyxl:Nexus_230173@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres');
async function drop() {
  await sql`DROP TABLE IF EXISTS shortlisted_students CASCADE`;
  await sql`DROP TABLE IF EXISTS students CASCADE`;
  await sql`DROP TABLE IF EXISTS jobs CASCADE`;
  await sql`DROP TABLE IF EXISTS admin CASCADE`;
  console.log('Tables dropped');
  process.exit(0);
}
drop();
