import 'dotenv/config';
import { db } from './src/config/db.js';
import { students, shortlistedStudents, jobs } from './src/db/schema/index.js';

async function main() {
  const allStudents = await db.select().from(students);
  console.log('--- Students ---');
  console.table(allStudents.map(s => ({
    student_id: s.student_id,
    full_name: s.full_name,
    email: s.email,
    application_status: s.application_status,
  })));

  const shortlisted = await db.select().from(shortlistedStudents);
  console.log('--- Shortlisted Students ---');
  console.table(shortlisted.map(s => ({
    student_id: s.student_id,
    current_stage: s.current_stage,
  })));

  const allJobs = await db.select().from(jobs);
  console.log('--- Jobs ---');
  console.table(allJobs.map(j => ({
    job_id: j.job_id,
    job_title: j.job_title,
    job_status: j.job_status,
  })));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
