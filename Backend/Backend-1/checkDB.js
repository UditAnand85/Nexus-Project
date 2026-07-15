import { db } from './src/config/db.js';
import { jobs, students, shortlistedStudents } from './src/db/schema/index.js';

async function checkState() {
  const allJobs = await db.select().from(jobs);
  console.log('JOBS:', allJobs.map(j => ({ id: j.job_id, status: j.job_status, cutoff: j.resume_cutoff_score })));

  const allStudents = await db.select().from(students);
  console.log('STUDENTS:', allStudents.map(s => ({ id: s.student_id, email: s.email, score: s.resume_score, status: s.application_status })));

  const shortlisted = await db.select().from(shortlistedStudents);
  console.log('SHORTLISTED_STUDENTS:', shortlisted.map(s => ({ id: s.student_id, stage: s.current_stage })));

  // Reset all jobs to 'Shortlisting Closed' so the user can click 'Evaluate' again
  await db.update(jobs).set({ job_status: 'Shortlisting Closed' });
  console.log('Reset jobs to Shortlisting Closed');

  process.exit(0);
}
checkState();
