import { eq, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import { shortlistedStudents, students, jobs } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Read Operations ──────────────────────────────────────────────────────────

export const getAllShortlisted = async () => {
  return await db
    .select()
    .from(shortlistedStudents)
    .leftJoin(students, eq(shortlistedStudents.student_id, students.student_id))
    .orderBy(desc(shortlistedStudents.updated_at));
};

export const getShortlistedByJob = async (jobId) => {
  return await db
    .select()
    .from(shortlistedStudents)
    .leftJoin(students, eq(shortlistedStudents.student_id, students.student_id))
    .where(eq(students.job_id, jobId))
    .orderBy(desc(shortlistedStudents.updated_at));
};

export const getShortlistedById = async (shortlistedId) => {
  const result = await db
    .select()
    .from(shortlistedStudents)
    .leftJoin(students, eq(shortlistedStudents.student_id, students.student_id))
    .where(eq(shortlistedStudents.shortlisted_id, shortlistedId))
    .limit(1);

  if (result.length === 0) {
    throw new AppError(`Shortlisted record with ID ${shortlistedId} not found.`, 404);
  }

  return result[0];
};

// ─── Process Backend-2 Result ─────────────────────────────────────────────────

/**
 * Called when Backend-2 POSTs a processed resume result to Backend-1.
 *
 * Actions:
 *  1. Verify student exists
 *  2. Update student with parsed resume JSON and ATS score
 *  3. Determine application_status (Shortlisted/Rejected) based on score vs job cutoff
 *  4. If shortlisted → create a shortlisted_students record
 *
 * @param {Object} data
 * @param {number} data.student_id
 * @param {Object} data.parsed_resume_json - Full AI-parsed resume data
 * @param {number} data.resume_score - ATS score (0–100)
 * @param {string|null} data.application_status - Optional override
 */
export const processResult = async ({
  student_id,
  parsed_resume_json,
  resume_score,
  application_status,
}) => {
  // 1. Verify student exists and get their job info
  const studentResult = await db
    .select({
      student_id: students.student_id,
      job_id: students.job_id,
      resume_cutoff_score: jobs.resume_cutoff_score,
    })
    .from(students)
    .leftJoin(jobs, eq(students.job_id, jobs.job_id))
    .where(eq(students.student_id, student_id))
    .limit(1);

  if (studentResult.length === 0) {
    throw new AppError(`Student with ID ${student_id} not found.`, 404);
  }

  const { resume_cutoff_score } = studentResult[0];

  // 2. Determine final status
  const score = parseFloat(resume_score);
  const cutoff = resume_cutoff_score || 0;
  const finalStatus =
    application_status || (score >= cutoff ? 'Shortlisted' : 'Rejected');

  // 3. Update student record
  await db
    .update(students)
    .set({
      parsed_resume_json,
      resume_score: String(score.toFixed(2)),
      application_status: finalStatus,
    })
    .where(eq(students.student_id, student_id));

  // 4. Create shortlisted record if applicable
  if (finalStatus === 'Shortlisted') {
    const existing = await db
      .select({ shortlisted_id: shortlistedStudents.shortlisted_id })
      .from(shortlistedStudents)
      .where(eq(shortlistedStudents.student_id, student_id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(shortlistedStudents).values({
        student_id,
        current_stage: 'Aptitude',
        updated_at: new Date(),
      });
    }
  }

  console.log(
    `[Result] Student ${student_id} → Score: ${score} | Status: ${finalStatus}`
  );

  return { student_id, resume_score: score, application_status: finalStatus };
};

// ─── Manual Status Update (Invite / Reject override) ─────────────────────────

/**
 * Allows admin to manually invite (shortlist) or reject a candidate before
 * shortlisting is closed for a job, regardless of their resume score.
 *
 * @param {Object} params
 * @param {string} params.student_id
 * @param {'Shortlisted' | 'Rejected'} params.action
 */
export const updateCandidateStatus = async ({ student_id, action }) => {
  // 1. Fetch candidate and job status
  const studentResult = await db
    .select({
      student_id: students.student_id,
      job_id: students.job_id,
      application_status: students.application_status,
      job_status: jobs.job_status,
    })
    .from(students)
    .leftJoin(jobs, eq(students.job_id, jobs.job_id))
    .where(eq(students.student_id, student_id))
    .limit(1);

  if (studentResult.length === 0) {
    throw new AppError(`Student with ID ${student_id} not found.`, 404);
  }

  const { job_status } = studentResult[0];

  // 2. Ensure shortlisting is not closed for this job
  if (job_status === 'Shortlisting Closed' || job_status === 'Evaluation Started' || job_status === 'Results Processed') {
    throw new AppError('Cannot modify candidate status after shortlisting has been closed.', 400);
  }

  // 3. Update student application status
  await db
    .update(students)
    .set({ application_status: action })
    .where(eq(students.student_id, student_id));

  // 4. Update or insert into shortlisted_students if action is Shortlisted, or remove if Rejected
  if (action === 'Shortlisted') {
    const existing = await db
      .select({ shortlisted_id: shortlistedStudents.shortlisted_id })
      .from(shortlistedStudents)
      .where(eq(shortlistedStudents.student_id, student_id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(shortlistedStudents).values({
        student_id,
        current_stage: 'Aptitude',
        updated_at: new Date(),
      });
    }
  } else if (action === 'Rejected') {
    await db
      .delete(shortlistedStudents)
      .where(eq(shortlistedStudents.student_id, student_id));
  }

  return { student_id, application_status: action };
};
