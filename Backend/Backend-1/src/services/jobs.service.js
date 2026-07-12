import { eq, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../config/db.js';
import { jobs, students, shortlistedStudents, admin } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Get All ──────────────────────────────────────────────────────────────────

export const getAllJobs = async () => {
  return await db
    .select({
      job_id: jobs.job_id,
      job_title: jobs.job_title,
      job_description: jobs.job_description,
      expected_ctc: jobs.expected_ctc,
      job_location: jobs.job_location,
      employment_type: jobs.employment_type,
      openings: jobs.openings,
      application_start_date: jobs.application_start_date,
      application_end_date: jobs.application_end_date,
      job_status: jobs.job_status,
      resume_cutoff_score: jobs.resume_cutoff_score,
      evaluation_prompt: jobs.evaluation_prompt,
      email_template: jobs.email_template,
      created_by: jobs.created_by,
      created_by_name: admin.full_name,
      created_at: jobs.created_at,
      updated_at: jobs.updated_at,
      applicants_count: sql`count(${students.student_id})::int`,
    })
    .from(jobs)
    .leftJoin(students, eq(jobs.job_id, students.job_id))
    .leftJoin(admin, eq(jobs.created_by, admin.admin_id))
    .groupBy(jobs.job_id, admin.full_name)
    .orderBy(desc(jobs.created_at));
};

// ─── Get By ID ────────────────────────────────────────────────────────────────

export const getJobById = async (jobId) => {
  const result = await db
    .select({
      job_id: jobs.job_id,
      job_title: jobs.job_title,
      job_description: jobs.job_description,
      expected_ctc: jobs.expected_ctc,
      job_location: jobs.job_location,
      employment_type: jobs.employment_type,
      openings: jobs.openings,
      application_start_date: jobs.application_start_date,
      application_end_date: jobs.application_end_date,
      job_status: jobs.job_status,
      resume_cutoff_score: jobs.resume_cutoff_score,
      evaluation_prompt: jobs.evaluation_prompt,
      email_template: jobs.email_template,
      created_by: jobs.created_by,
      created_by_name: admin.full_name,
      created_at: jobs.created_at,
      updated_at: jobs.updated_at,
      applicants_count: sql`count(${students.student_id})::int`,
    })
    .from(jobs)
    .leftJoin(students, eq(jobs.job_id, students.job_id))
    .leftJoin(admin, eq(jobs.created_by, admin.admin_id))
    .where(eq(jobs.job_id, jobId))
    .groupBy(jobs.job_id, admin.full_name)
    .limit(1);

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
  const job = await getJobById(jobId); // Throws 404 if not found
  
  if (job.job_status === 'Open') {
    throw new AppError('Cannot delete a job that is still open. Please close shortlisting first.', 400);
  }

  // 1. Find all students for this job
  const jobStudents = await db
    .select({ id: students.student_id })
    .from(students)
    .where(eq(students.job_id, jobId));
    
  const studentIds = jobStudents.map(s => s.id);

  // 2. Delete from shortlisted_students if any exist
  if (studentIds.length > 0) {
    await db.delete(shortlistedStudents).where(inArray(shortlistedStudents.student_id, studentIds));
    
    // 3. Delete from students
    await db.delete(students).where(eq(students.job_id, jobId));
  }

  // 4. Finally delete the job
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

// ─── Get Ranked Candidates ───────────────────────────────────────────────────

export const getRankedStudents = async (jobId) => {
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
    .where(eq(students.job_id, jobId));

  // Sort by final_score descending (place nulls at the end)
  const sorted = result.sort((a, b) => {
    const scoreA = a.final_score ? parseFloat(a.final_score) : 0;
    const scoreB = b.final_score ? parseFloat(b.final_score) : 0;
    return scoreB - scoreA;
  });

  // Assign ranks
  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
};
