import { eq, desc, and } from 'drizzle-orm';
import { db } from '../config/db.js';
import { students, jobs } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { addResumeJob } from '../queues/resumeQueue.js';

// ─── Submit Application ───────────────────────────────────────────────────────

/**
 * Creates a student application record and pushes resume to BullMQ for AI processing.
 *
 * Flow:
 *  1. Validate job exists and is Open
 *  2. Check for duplicate application (same email + job)
 *  3. Insert student record with status "Applied"
 *  4. Push resume (as base64) to BullMQ queue → Backend-2 processes
 *  5. Return student record
 */
export const submitApplication = async ({
  full_name,
  email,
  phone,
  jobId,
  resumeBuffer,
  resumeMimeType,
  resumeOriginalName,
}) => {
  // 1. Check job exists
  const jobResult = await db.select().from(jobs).where(eq(jobs.job_id, jobId)).limit(1);
  if (jobResult.length === 0) {
    throw new AppError(`Job with ID ${jobId} not found.`, 404);
  }

  const job = jobResult[0];

  // 2. Check job is accepting applications
  if (job.job_status !== 'Open') {
    throw new AppError(
      'This job is no longer accepting applications. Applications are closed.',
      400
    );
  }

  // 3. Duplicate check — same email cannot apply to same job twice
  const duplicate = await db
    .select({ student_id: students.student_id })
    .from(students)
    .where(and(eq(students.email, email), eq(students.job_id, jobId)))
    .limit(1);

  if (duplicate.length > 0) {
    throw new AppError('You have already submitted an application for this job.', 409);
  }

  // 4. Create student record
  const [newStudent] = await db
    .insert(students)
    .values({
      full_name,
      email,
      phone: phone || null,
      job_id: jobId,
      resume_url: null, // Resume is NOT stored; forwarded to Backend-2
      application_status: 'Applied',
    })
    .returning();

  // 5. Push to BullMQ queue (fire-and-forget)
  await addResumeJob({
    studentId: newStudent.student_id,
    jobId,
    fullName: full_name,
    email,
    phone: phone || null,
    resumeBase64: resumeBuffer.toString('base64'),
    resumeMimeType,
    resumeOriginalName,
    evaluationPrompt: job.evaluation_prompt || '',
    resumeCutoffScore: job.resume_cutoff_score || 0,
  });

  return {
    student_id: newStudent.student_id,
    full_name: newStudent.full_name,
    email: newStudent.email,
    job_id: newStudent.job_id,
    application_status: newStudent.application_status,
    created_at: newStudent.created_at,
  };
};

// ─── Read Operations ──────────────────────────────────────────────────────────

export const getAllStudents = async () => {
  return await db.select().from(students).orderBy(desc(students.created_at));
};

export const getStudentsByJob = async (jobId) => {
  return await db
    .select()
    .from(students)
    .where(eq(students.job_id, jobId))
    .orderBy(desc(students.created_at));
};

export const getStudentById = async (studentId) => {
  const result = await db
    .select()
    .from(students)
    .where(eq(students.student_id, studentId))
    .limit(1);

  if (result.length === 0) {
    throw new AppError(`Student with ID ${studentId} not found.`, 404);
  }

  return result[0];
};
