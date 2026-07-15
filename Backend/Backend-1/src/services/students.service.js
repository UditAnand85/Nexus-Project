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
    const fileName = `${fileHash}.${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: resumeBuffer,
      ContentType: resumeMimeType,
    });

    try {
      await s3Client.send(command);
      
      // Construct public URL
      resume_url = `https://${env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${fileName}`;

      // Update student record with resume_url
      await db.update(students)
        .set({ resume_url })
        .where(eq(students.student_id, newStudent.student_id));
        
      newStudent.resume_url = resume_url;
    } catch (uploadError) {
      console.error('[Service] AWS S3 upload error:', uploadError);
    }
  } catch (err) {
    console.error('[Service] Failed to upload resume to S3:', err);
  }

  // 5. Push job to Queue for background processing
  try {
    const base64Resume = resumeBuffer.toString('base64');

    await resumeQueue.add('parse_resume', {
      student_id: newStudent.student_id,
      base64Resume,
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

    console.log(`[Service] Pushed resume to queue for student ${newStudent.student_id}`);
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

      // 3. Download from S3
      const command = new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: fileName,
      });

      let response;
      try {
        response = await s3Client.send(command);
      } catch (error) {
        console.error(`[Service] Failed to download resume for student ${student.student_id}:`, error);
        continue;
      }

      // 4. Convert stream to base64
      const streamToBuffer = async (stream) => {
        return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', (chunk) => chunks.push(chunk));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
      };
      
      const buffer = await streamToBuffer(response.Body);
      const base64Resume = buffer.toString('base64');
      
      const mimeType = response.ContentType || 'application/pdf';

      // 5. Push back to Queue
      await resumeQueue.add('parse_resume', {
        student_id: student.student_id,
        base64Resume,
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
      
      console.log(`[Service] Re-queued resume for student ${student.student_id}`);
      count++;
    } catch (err) {
      console.error(`[Service] Error processing failed resume for student ${student.student_id}:`, err);
    }
  }

  return { queuedCount: count, totalFound: failedStudents.length };
};
