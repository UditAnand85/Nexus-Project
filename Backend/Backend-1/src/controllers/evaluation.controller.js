import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { students, jobs } from '../db/schema/index.js';
import { env } from '../config/env.js';

/**
 * GET /api/v1/evaluate/verify?token=...
 * Verifies the candidate's evaluation JWT and returns their profile + job info.
 * This is called by the frontend evaluation landing page to hydrate the UI.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Evaluation token is required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        message: isExpired
          ? 'Your evaluation link has expired. Please contact the recruiter.'
          : 'Invalid evaluation link.',
      });
    }

    const { student_id, job_id } = decoded;

    // Fetch student details
    const studentResult = await db
      .select({
        student_id: students.student_id,
        full_name: students.full_name,
        email: students.email,
        application_status: students.application_status,
        resume_score: students.resume_score,
      })
      .from(students)
      .where(eq(students.student_id, student_id))
      .limit(1);

    if (studentResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Candidate not found.' });
    }

    // Fetch job details
    const jobResult = await db
      .select({
        job_id: jobs.job_id,
        job_title: jobs.job_title,
        job_status: jobs.job_status,
        employment_type: jobs.employment_type,
        job_location: jobs.job_location,
      })
      .from(jobs)
      .where(eq(jobs.job_id, job_id))
      .limit(1);

    if (jobResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    res.status(200).json({
      success: true,
      data: {
        student: studentResult[0],
        job: jobResult[0],
      },
    });
  } catch (error) {
    next(error);
  }
};
