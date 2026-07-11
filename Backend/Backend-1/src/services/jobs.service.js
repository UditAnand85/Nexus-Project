import { eq, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import { jobs } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Get All ──────────────────────────────────────────────────────────────────

export const getAllJobs = async () => {
  return await db.select().from(jobs).orderBy(desc(jobs.created_at));
};

// ─── Get By ID ────────────────────────────────────────────────────────────────

export const getJobById = async (jobId) => {
  const result = await db.select().from(jobs).where(eq(jobs.job_id, jobId)).limit(1);

  if (result.length === 0) {
    throw new AppError(`Job with ID ${jobId} not found.`, 404);
  }

  return result[0];
};

// ─── Create ───────────────────────────────────────────────────────────────────

export const createJob = async (data, adminId) => {
  const {
    job_title,
    job_description,
    expected_ctc,
    job_location,
    employment_type,
    openings,
    application_start_date,
    application_end_date,
    resume_cutoff_score,
    evaluation_prompt,
    email_template,
  } = data;

  if (!job_title || !job_description) {
    throw new AppError('Job title and description are required.', 400);
  }

  const [newJob] = await db
    .insert(jobs)
    .values({
      job_title,
      job_description,
      expected_ctc: expected_ctc || null,
      job_location: job_location || null,
      employment_type: employment_type || null,
      openings: openings || 1,
      application_start_date: application_start_date || null,
      application_end_date: application_end_date || null,
      job_status: 'Open',
      resume_cutoff_score: resume_cutoff_score ?? 0,
      evaluation_prompt: evaluation_prompt || null,
      email_template: email_template || null,
      created_by: adminId,
    })
    .returning();

  return newJob;
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateJob = async (jobId, data) => {
  // Validate job exists
  await getJobById(jobId);

  // Strip non-updatable fields for safety
  const { job_id, created_by, created_at, ...updateData } = data;

  const [updatedJob] = await db
    .update(jobs)
    .set({ ...updateData, updated_at: new Date() })
    .where(eq(jobs.job_id, jobId))
    .returning();

  return updatedJob;
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deleteJob = async (jobId) => {
  await getJobById(jobId); // Throws 404 if not found
  await db.delete(jobs).where(eq(jobs.job_id, jobId));
};

// ─── Stop Shortlisting ────────────────────────────────────────────────────────

/**
 * Sets job_status to "Shortlisting Closed".
 * After this, the job appears as "Closed" on the candidate-facing portal.
 */
export const stopShortlisting = async (jobId) => {
  const job = await getJobById(jobId);

  if (job.job_status === 'Shortlisting Closed') {
    throw new AppError('Shortlisting is already closed for this job.', 400);
  }

  const [updatedJob] = await db
    .update(jobs)
    .set({ job_status: 'Shortlisting Closed', updated_at: new Date() })
    .where(eq(jobs.job_id, jobId))
    .returning();

  return updatedJob;
};
