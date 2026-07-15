import { db } from './src/config/db.js';
import { jobs, students } from './src/db/schema/index.js';
import { eq, ilike } from 'drizzle-orm';

async function check() {
  const [job] = await db.select().from(jobs).where(ilike(jobs.job_title, '%frontend%')).limit(1);
  if (!job) {
    console.log('No frontend job found');
    process.exit(0);
  }
  
  console.log('Found Job:', job.job_id, job.job_title, job.job_status);
  
  const allStudents = await db
      .select({
        student_id: students.student_id,
        email: students.email,
        application_status: students.application_status,
        resume_score: students.resume_score,
      })
      .from(students)
      .where(eq(students.job_id, job.job_id));
      
  console.log('All candidates for this job:', allStudents.length);
  console.log(allStudents);
  process.exit(0);
}

check();
