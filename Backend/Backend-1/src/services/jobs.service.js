import { eq, desc, sql, inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { db } from '../config/db.js';
import { jobs, students, shortlistedStudents, admin } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { sesClient } from '../config/ses.js';
import { env } from '../config/env.js';
import { deleteJobQuestions } from './questions.service.js';
import { questionsQueue } from '../queues/questions.queue.js';

// ─── Get All ──────────────────────────────────────────────────────────────────

export const getAllJobs = async (status) => {
  let query = db
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
    .leftJoin(admin, eq(jobs.created_by, admin.admin_id));

  if (status) {
    query = query.where(eq(jobs.job_status, status));
  }

  return await query
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

  // Enqueue question generation — runs in background worker with retries.
  // Does NOT block or fail the job creation response.
  await questionsQueue.add('generate_questions', {
    jobId: newJob.job_id,
    jobTitle: job_title,
    jobDescription: job_description,
  });
  console.log(`[Jobs] Queued question generation for job ${newJob.job_id} ("${job_title}")`);

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

  // 1. Delete AI-generated technical questions for this job
  await deleteJobQuestions(jobId);

  // 2. Find all students for this job
  const jobStudents = await db
    .select({ id: students.student_id })
    .from(students)
    .where(eq(students.job_id, jobId));
    
  const studentIds = jobStudents.map(s => s.id);

  // 3. Delete from shortlisted_students if any exist
  if (studentIds.length > 0) {
    await db.delete(shortlistedStudents).where(inArray(shortlistedStudents.student_id, studentIds));
    
    // 4. Delete from students
    await db.delete(students).where(eq(students.job_id, jobId));
  }

  // 5. Finally delete the job
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

// ─── Start Evaluation ────────────────────────────────────────────────────────

/**
 * Sets job_status to "Evaluation Started".
 */
export const startEvaluation = async (jobId) => {
  const job = await getJobById(jobId);

  if (job.job_status === 'Evaluation Started') {
    throw new AppError('Evaluation has already started for this job.', 400);
  }

  if (job.job_status !== 'Shortlisting Closed') {
    throw new AppError('You must close shortlisting before starting evaluation.', 400);
  }

  const [updatedJob] = await db
    .update(jobs)
    .set({ job_status: 'Evaluation Started', updated_at: new Date() })
    .where(eq(jobs.job_id, jobId))
    .returning();

  // ─── Send evaluation emails to all shortlisted candidates ───────────────────
  try {
    const shortlisted = await db
      .select({
        student_id: students.student_id,
        full_name: students.full_name,
        email: students.email,
      })
      .from(shortlistedStudents)
      .innerJoin(students, eq(shortlistedStudents.student_id, students.student_id))
      .where(eq(students.job_id, jobId));

    const clientUrl = env.PRIMARY_CLIENT_URL;

    for (const candidate of shortlisted) {
      // Sign a JWT valid for 7 days
      const token = jwt.sign(
        { student_id: candidate.student_id, job_id: jobId },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const evaluationUrl = `${clientUrl}/evaluate?token=${token}`;

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #ffffff;">
          <div style="margin-bottom: 32px;">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <div style="width: 28px; height: 28px; background: #1a1a1a; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: white; font-family: monospace; font-size: 11px; font-weight: 600;">RA</span>
              </div>
              <span style="font-size: 17px; font-weight: 600; color: #1a1a1a;">RecruitAI</span>
            </div>
          </div>

          <h1 style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px;">You've been shortlisted! 🎉</h1>
          <p style="font-size: 15px; color: #555; margin: 0 0 24px; line-height: 1.6;">
            Hi <strong>${candidate.full_name}</strong>, congratulations! You have been shortlisted for the role of
            <strong>${job.job_title}</strong>. The next step is your online evaluation.
          </p>

          <div style="background: #f8f8f7; border: 1px solid #e5e5e3; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
            <p style="font-size: 13px; color: #888; margin: 0 0 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.05em;">Your evaluation includes</p>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="font-size: 14px; color: #1a1a1a;">🧠 &nbsp;<strong>Step 1</strong> — Aptitude Test</div>
              <div style="font-size: 14px; color: #1a1a1a;">💻 &nbsp;<strong>Step 2</strong> — Technical Assessment</div>
              <div style="font-size: 14px; color: #1a1a1a;">⭐ &nbsp;<strong>Step 3</strong> — Final Review</div>
            </div>
          </div>

          <p style="font-size: 13px; color: #888; margin: 0 0 12px;">This link is unique to you and valid for <strong>7 days</strong>. Do not share it.</p>

          <a href="${evaluationUrl}" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">Start My Evaluation →</a>

          <p style="font-size: 12px; color: #aaa; margin-top: 32px; line-height: 1.5;">If the button doesn't work, copy and paste this link: <br>${evaluationUrl}</p>
        </div>
      `;

      const emailCommand = new SendEmailCommand({
        Source: env.AWS_SES_FROM_EMAIL,
        Destination: { ToAddresses: [candidate.email] },
        Message: {
          Subject: { Data: `Action Required: Start your evaluation for ${job.job_title}`, Charset: 'UTF-8' },
          Body: { Html: { Data: emailHtml, Charset: 'UTF-8' } },
        },
      });

      try {
        await sesClient.send(emailCommand);
        console.log(`[Evaluation] Email sent successfully to ${candidate.email}`);
      } catch (err) {
        console.error(`[Evaluation] Failed to send email to ${candidate.email} (Is it verified in AWS Sandbox?):`, err.message);
      }
    }

    console.log(`[Evaluation] Finished processing emails for ${shortlisted.length} candidates for job ${jobId}`);
  } catch (err) {
    console.error('[Evaluation] Fatal error in email dispatch block:', err.message);
  }

  return updatedJob;
};

// ─── Get Ranked Candidates ───────────────────────────────────────────────────

export const getRankedStudents = async (jobId) => {
  const [job] = await db
    .select({ job_status: jobs.job_status })
    .from(jobs)
    .where(eq(jobs.job_id, jobId))
    .limit(1);
  const jobStatus = job?.job_status || 'Open';

  const result = await db
    .select({
      student_id: students.student_id,
      full_name: students.full_name,
      email: students.email,
      phone: students.phone,
      job_id: students.job_id,

      resume_score: students.resume_score,
      parsed_resume_json: students.parsed_resume_json,
      application_status: students.application_status,
      created_at: students.created_at,
      shortlisted_id: shortlistedStudents.shortlisted_id,
      aptitude_score: shortlistedStudents.aptitude_score,
      final_score: shortlistedStudents.final_score,
      current_stage: shortlistedStudents.current_stage,
    })
    .from(students)
    .leftJoin(shortlistedStudents, eq(students.student_id, shortlistedStudents.student_id))
    .where(eq(students.job_id, jobId));

  // Sort by resume_score descending (place nulls at the end)
  const sorted = result.sort((a, b) => {
    const scoreA = a.resume_score ? parseFloat(a.resume_score) : 0;
    const scoreB = b.resume_score ? parseFloat(b.resume_score) : 0;
    return scoreB - scoreA;
  }).slice(0, 15);

  // Assign ranks and conditionally hide shortlisted status
  return sorted.map((item, index) => {
    const finalItem = { ...item, rank: index + 1 };
    if (jobStatus !== 'Results Processed') {
      finalItem.application_status = 'Applied';
      finalItem.current_stage = null;
    }
    return finalItem;
  });
};

// ─── Process Results ────────────────────────────────────────────────────────

/**
 * Processes the job evaluation results.
 * Distributes candidates based on openings (Selected, Waitlist, Rejected)
 * and sends AWS SES emails.
 */
export const processJobResults = async (jobId) => {
  const job = await getJobById(jobId);

  if (job.job_status !== 'Evaluation Started') {
    throw new AppError('Job must be in Evaluation Started status to process results.', 400);
  }

  const openings = job.openings || 1;
  const numSelected = openings * 2;
  const numWaitlist = openings;

  // Update job status
  const [updatedJob] = await db
    .update(jobs)
    .set({ job_status: 'Results Processed', updated_at: new Date() })
    .where(eq(jobs.job_id, jobId))
    .returning();

  // Fetch all shortlisted candidates, joined with students for email
  const allCandidates = await db
    .select({
      student_id: students.student_id,
      shortlisted_id: shortlistedStudents.shortlisted_id,
      full_name: students.full_name,
      email: students.email,
      final_score: shortlistedStudents.final_score,
      resume_score: students.resume_score,
    })
    .from(students)
    .innerJoin(shortlistedStudents, eq(students.student_id, shortlistedStudents.student_id))
    .where(eq(students.job_id, jobId));

  // Sort: final_score DESC (if available), then resume_score DESC
  const sorted = allCandidates.sort((a, b) => {
    const scoreA = parseFloat(a.final_score || a.resume_score || 0);
    const scoreB = parseFloat(b.final_score || b.resume_score || 0);
    return scoreB - scoreA;
  });

  for (let i = 0; i < sorted.length; i++) {
    const candidate = sorted[i];
    let newStage = '';
    let emailHtml = '';
    let emailSubject = '';

    if (i < numSelected) {
      newStage = 'Selected';
      emailSubject = `Congratulations! Invitation to Physical Interview for ${job.job_title}`;
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Physical Interview Invitation</h2>
          <p>Hi <strong>${candidate.full_name}</strong>,</p>
          <p>Congratulations! Based on your evaluation, we are thrilled to invite you to a physical onsite interview for the <strong>${job.job_title}</strong> role at RecruitAI.</p>
          <p>Our recruitment team will be in touch shortly to schedule the exact date and time.</p>
          <p>Best regards,<br>The RecruitAI Team</p>
        </div>
      `;
    } else if (i < numSelected + numWaitlist) {
      newStage = 'Waitlist';
      // No automated email for waitlisted as per requirements
    } else {
      newStage = 'Rejected';
      emailSubject = `Update on your application for ${job.job_title}`;
      emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a1a;">Application Update</h2>
          <p>Hi <strong>${candidate.full_name}</strong>,</p>
          <p>Thank you very much for applying to the <strong>${job.job_title}</strong> role and completing the evaluation process.</p>
          <p>While we were impressed with your background, we have decided to move forward with other candidates who more closely align with our current needs for this position.</p>
          <p>We appreciate the time you invested and wish you the best in your job search.</p>
          <p>Best regards,<br>The RecruitAI Team</p>
        </div>
      `;
    }

    // Update the database
    await db
      .update(shortlistedStudents)
      .set({ current_stage: newStage, updated_at: new Date() })
      .where(eq(shortlistedStudents.shortlisted_id, candidate.shortlisted_id));

    // Send emails for Selected and Rejected
    if (newStage === 'Selected' || newStage === 'Rejected') {
      const emailCommand = new SendEmailCommand({
        Source: env.AWS_SES_FROM_EMAIL,
        Destination: { ToAddresses: [candidate.email] },
        Message: {
          Subject: { Data: emailSubject, Charset: 'UTF-8' },
          Body: { Html: { Data: emailHtml, Charset: 'UTF-8' } },
        },
      });

      try {
        await sesClient.send(emailCommand);
        console.log(`[Process Results] Sent ${newStage} email to ${candidate.email}`);
      } catch (err) {
        console.error(`[Process Results] Failed to send ${newStage} email to ${candidate.email}:`, err.message);
      }
    }
  }

  return updatedJob;
};
