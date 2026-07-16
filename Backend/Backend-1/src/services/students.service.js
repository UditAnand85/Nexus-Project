import { eq, desc, and, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { students, jobs, shortlistedStudents } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { resumeQueue } from '../queues/resume.queue.js';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3.js';
import { env } from '../config/env.js';

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

  // 4. Create student record first with null AI data
  const [newStudent] = await db
    .insert(students)
    .values({
      full_name,
      email,
      phone: phone || null,
      job_id: jobId,

      parsed_resume_json: null,
      resume_score: null,
      application_status: 'Applied',
    })
    .returning();

  // 4.5 Upload resume to AWS S3
  let resume_url = null;
  try {
    const fileHash = crypto.createHash('sha256').update(resumeBuffer).digest('hex');
    const fileExtension = resumeOriginalName.split('.').pop();
    const fileName = `resumes/${fileHash}.${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: resumeBuffer,
      ContentType: resumeMimeType,
    });

    await s3Client.send(command);
    
    // Construct public URL
    resume_url = `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Update student record with resume_url
    await db.update(students)
      .set({ resume_url })
      .where(eq(students.student_id, newStudent.student_id));
      
    newStudent.resume_url = resume_url;
    console.log(`[Service] Resume uploaded to S3 for student ${newStudent.student_id}: ${resume_url}`);
  } catch (uploadError) {
    console.error(
      `[Service] ⚠️  S3 upload FAILED for student ${newStudent.student_id}. ` +
      `Bucket: "${env.AWS_S3_BUCKET_NAME}", Region: "${env.AWS_REGION}". ` +
      `Error: ${uploadError.message}. ` +
      `Resume will NOT be queued for AI scoring.`
    );
    // Return early success (application was saved) but without AI scoring
    return {
      student_id: newStudent.student_id,
      full_name: newStudent.full_name,
      email: newStudent.email,
      job_id: newStudent.job_id,
      resume_url: null,
      resume_score: null,
      parsed_resume_json: null,
      application_status: newStudent.application_status,
      created_at: newStudent.created_at,
    };
  }

  // 5. Push job to Queue for background processing (only if S3 upload succeeded)
  try {
    await resumeQueue.add('parse_resume', {
      student_id: newStudent.student_id,
      resumeUrl: resume_url,
      mimeType: resumeMimeType,
      originalName: resumeOriginalName,
      formDataParams: {
        full_name,
        email,
        phone,
        jobId,
        evaluation_prompt: job.evaluation_prompt,
        resume_cutoff_score: job.resume_cutoff_score,
        job_title: job.job_title,
        job_description: job.job_description,
      }
    });

    console.log(`[Service] Pushed resume URL to queue for student ${newStudent.student_id}`);
  } catch (error) {
    console.error(`[Service] Failed to push to queue for student ${newStudent.student_id}`, error);
    // Note: We swallow the error here so the user still gets a success response,
    // but the resume won't be processed. In a robust system, we might delete the user
    // or flag them as failed.
  }

  return {
    student_id: newStudent.student_id,
    full_name: newStudent.full_name,
    email: newStudent.email,
    job_id: newStudent.job_id,
    resume_url: newStudent.resume_url,
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
      resume_url: students.resume_url,

      resume_score: students.resume_score,
      parsed_resume_json: students.parsed_resume_json,
      application_status: students.application_status,
      created_at: students.created_at,
      shortlisted_id: shortlistedStudents.shortlisted_id,
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

// ─── Disaster Recovery ────────────────────────────────────────────────────────

export const retryFailedResumes = async () => {
  // 1. Fetch students where resume_score is null (not processed) 
  const failedStudents = await db
    .select({
      student_id: students.student_id,
      full_name: students.full_name,
      email: students.email,
      phone: students.phone,
      resume_url: students.resume_url,
      job_id: jobs.job_id,
      evaluation_prompt: jobs.evaluation_prompt,
      resume_cutoff_score: jobs.resume_cutoff_score,
      job_title: jobs.job_title,
      job_description: jobs.job_description,
    })
    .from(students)
    .innerJoin(jobs, eq(students.job_id, jobs.job_id))
    .where(and(isNull(students.resume_score), eq(students.application_status, 'Applied')));

  let count = 0;

  for (const student of failedStudents) {
    if (!student.resume_url) continue;

    try {
      // 2. Extract fileName from resume_url
      const urlParts = student.resume_url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Determine MIME type based on extension
      const getMimeType = (name) => {
        const ext = name.split('.').pop().toLowerCase();
        if (ext === 'pdf') return 'application/pdf';
        if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (ext === 'doc') return 'application/msword';
        return 'application/octet-stream';
      };
      const mimeType = getMimeType(fileName);

      // 5. Push back to Queue
      await resumeQueue.add('parse_resume', {
        student_id: student.student_id,
        resumeUrl: student.resume_url,
        mimeType: mimeType,
        originalName: fileName, 
        formDataParams: {
          full_name: student.full_name,
          email: student.email,
          phone: student.phone,
          jobId: student.job_id,
          evaluation_prompt: student.evaluation_prompt,
          resume_cutoff_score: student.resume_cutoff_score,
          job_title: student.job_title,
          job_description: student.job_description,
        }
      });
      
      console.log(`[Service] Re-queued resume URL for student ${student.student_id}`);
      count++;
    } catch (err) {
      console.error(`[Service] Error processing failed resume for student ${student.student_id}:`, err);
    }
  }

  return { queuedCount: count, totalFound: failedStudents.length };
};
