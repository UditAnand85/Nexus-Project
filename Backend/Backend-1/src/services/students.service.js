import { eq, desc, and } from 'drizzle-orm';
import { db } from '../config/db.js';
import { students, jobs, shortlistedStudents } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

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

  // 4. Call Backend-2 for AI Parsing synchronously
  let parsed_resume_json = null;
  let resume_score = 0;

  try {
    const formData = new FormData();
    formData.append('name', full_name);
    formData.append('email', email);
    if (phone) formData.append('phone', phone);
    formData.append('job_id', jobId.toString());
    formData.append('evaluation_prompt', job.evaluation_prompt || '');
    formData.append('resume_cutoff_score', (job.resume_cutoff_score || 0).toString());
    
    const resumeBlob = new Blob([resumeBuffer], { type: resumeMimeType });
    formData.append('resume', resumeBlob, resumeOriginalName);

    const backend2Url = process.env.BACKEND2_URL || 'http://127.0.0.1:5001';
    console.log(`[Service] Sending resume to Backend-2 at ${backend2Url}/api/v1/resume/parse`);
    
    const response = await fetch(`${backend2Url}/api/v1/resume/parse`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.success && data.data) {
      parsed_resume_json = data.data.parsed_resume_json;
      resume_score = data.data.resume_score;
    } else {
      console.error('[Service] Backend-2 error:', data.message);
    }
  } catch (error) {
    console.error('[Service] Failed to parse resume in Backend-2:', error);
  }

  // 5. Create student record with parsed AI data
  const [newStudent] = await db
    .insert(students)
    .values({
      full_name,
      email,
      phone: phone || null,
      job_id: jobId,

      parsed_resume_json: parsed_resume_json,
      resume_score: resume_score,
      application_status: 'Applied',
    })
    .returning();

  return {
    student_id: newStudent.student_id,
    full_name: newStudent.full_name,
    email: newStudent.email,
    job_id: newStudent.job_id,
    resume_score: newStudent.resume_score,
    parsed_resume_json: newStudent.parsed_resume_json,
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
    .select({
      student_id: students.student_id,
      full_name: students.full_name,
      email: students.email,
      phone: students.phone,
      job_id: students.job_id,

      resume_score: students.resume_score,
      application_status: students.application_status,
      created_at: students.created_at,
      shortlisted_id: shortlistedStudents.shortlisted_id,
      video_url: shortlistedStudents.video_url,
      video_score: shortlistedStudents.video_score,
      aptitude_score: shortlistedStudents.aptitude_score,
      final_score: shortlistedStudents.final_score,
      recommendation: shortlistedStudents.recommendation,
      current_stage: shortlistedStudents.current_stage,
    })
    .from(students)
    .leftJoin(shortlistedStudents, eq(students.student_id, shortlistedStudents.student_id))
    .where(eq(students.student_id, studentId))
    .limit(1);

  if (result.length === 0) {
    throw new AppError(`Student with ID ${studentId} not found.`, 404);
  }

  return result[0];
};
