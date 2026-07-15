import { db } from './src/config/db.js';
import { jobs, shortlistedStudents, students } from './src/db/schema/index.js';
import { eq, ilike } from 'drizzle-orm';
import { startEvaluation } from './src/services/jobs.service.js';

async function test() {
  const [job] = await db.select().from(jobs).where(ilike(jobs.job_title, '%backend%')).limit(1);
  console.log('Testing startEvaluation for Job:', job.job_id);
  
  // Verify what's in the DB
  const shortlisted = await db
      .select({
        student_id: students.student_id,
        email: students.email,
      })
      .from(shortlistedStudents)
      .innerJoin(students, eq(shortlistedStudents.student_id, students.student_id))
      .where(eq(students.job_id, job.job_id));
  console.log('Shortlisted candidates in DB:', shortlisted.length);
  console.log(shortlisted);
  
  // Reset it to shortlisting closed first
  await db.update(jobs).set({ job_status: 'Shortlisting Closed' }).where(eq(jobs.job_id, job.job_id));
  
  try {
    await startEvaluation(job.job_id);
    console.log('startEvaluation succeeded!');
  } catch (err) {
    console.log('startEvaluation failed:', err);
  }
  process.exit(0);
}

test();
