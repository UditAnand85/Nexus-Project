import { db } from './src/config/db.js';
import { students, jobs } from './src/db/schema/index.js';
import { eq, isNull, and, isNotNull } from 'drizzle-orm';
import { resumeQueue } from './src/queues/resume.queue.js';

async function retryScoring() {
  console.log('🔄 Finding resumes that are in S3 but missing an ATS score...');

  try {
    // 1. Fetch all students who have a resume_url but NO resume_score
    const pendingStudents = await db
      .select({
        student_id: students.student_id,
        full_name: students.full_name,
        email: students.email,
        phone: students.phone,
        resume_url: students.resume_url,
        job_id: jobs.job_id,
        job_title: jobs.job_title,
        job_description: jobs.job_description,
        evaluation_prompt: jobs.evaluation_prompt,
        resume_cutoff_score: jobs.resume_cutoff_score,
      })
      .from(students)
      .innerJoin(jobs, eq(students.job_id, jobs.job_id))
      .where(
        and(
          isNotNull(students.resume_url),
          isNull(students.resume_score)
        )
      );

    if (pendingStudents.length === 0) {
      console.log('✅ All resumes with URLs have been scored! Nothing to retry.');
      process.exit(0);
    }

    console.log(`Found ${pendingStudents.length} unscored resumes. Pushing them to the queue...`);

    // 2. Add each to the BullMQ queue
    for (const student of pendingStudents) {
      await resumeQueue.add('parse_resume', {
        student_id: student.student_id,
        resumeUrl: student.resume_url,
        mimeType: 'application/pdf', 
        originalName: 'Unknown.pdf',
        formDataParams: {
          full_name: student.full_name,
          email: student.email,
          phone: student.phone,
          jobId: student.job_id,
          evaluation_prompt: student.evaluation_prompt,
          resume_cutoff_score: student.resume_cutoff_score,
          job_title: student.job_title,
          job_description: student.job_description,
        },
      });
      console.log(`✅ Pushed ${student.full_name} (${student.student_id}) to resumeProcessing queue`);
    }

    console.log(`🎉 Finished queuing ${pendingStudents.length} resumes for AI scoring.`);
  } catch (error) {
    console.error('❌ Error during retry:', error);
  } finally {
    process.exit(0);
  }
}

retryScoring();
