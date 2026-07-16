import { db } from './src/config/db.js';
import { jobs, students, shortlistedStudents } from './src/db/schema/index.js';
import { eq, ilike } from 'drizzle-orm';

async function resetBackendJob() {
  const emailToShortlist = 'uditanand0@gmail.com';
  
  // 1. Find the Backend Engineer job
  const [job] = await db.select().from(jobs).where(ilike(jobs.job_title, '%backend%')).limit(1);
  if (!job) {
    console.log('No backend job found');
    process.exit(0);
  }
  
  console.log('Found Job:', job.job_id, job.job_title, job.job_status);
  
  // 2. Set job status to "Shortlisting Closed"
  await db.update(jobs).set({ job_status: 'Shortlisting Closed' }).where(eq(jobs.job_id, job.job_id));
  console.log('Job status reset to "Shortlisting Closed".');
  
  // 3. Find the student's application for this job
  const [student] = await db.select().from(students)
    .where(eq(students.email, emailToShortlist))
    .where(eq(students.job_id, job.job_id))
    .limit(1);
    
  if (!student) {
    console.log(`Student ${emailToShortlist} has not applied for this job.`);
    console.log('I will create a dummy application for them so you can test.');
    
    // Create dummy student application
    const [newStudent] = await db.insert(students).values({
      full_name: 'Udit Anand',
      email: emailToShortlist,
      phone: '1234567890',
      job_id: job.job_id,
      resume_score: 99,
      application_status: 'Shortlisted'
    }).returning();
    
    await db.insert(shortlistedStudents).values({
      student_id: newStudent.student_id,
      current_stage: 'Aptitude',
    });
    console.log('Created dummy application and shortlisted it.');
  } else {
    console.log(`Found existing application. Current status: ${student.application_status}`);
    
    // Update status to Shortlisted
    await db.update(students).set({ application_status: 'Shortlisted' }).where(eq(students.student_id, student.student_id));
    
    // Insert into shortlisted_students if not exists
    const existing = await db.select().from(shortlistedStudents).where(eq(shortlistedStudents.student_id, student.student_id));
    if (existing.length === 0) {
      await db.insert(shortlistedStudents).values({
        student_id: student.student_id,
        current_stage: 'Aptitude',
      });
      console.log('Inserted into shortlisted_students!');
    } else {
      console.log('Already in shortlisted_students.');
    }
  }
  
  console.log('Done! You can now click Evaluate for Backend Engineer.');
  process.exit(0);
}

resetBackendJob();
