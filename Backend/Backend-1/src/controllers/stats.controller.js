import { db } from '../config/db.js';
import { jobs, students, shortlistedStudents } from '../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/v1/stats
 * Retrieve real-time dashboard statistics counts.
 */
export const getStats = async (req, res, next) => {
  try {
    // 1. Get open jobs count (status = 'Open')
    const [openJobsResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(jobs)
      .where(eq(jobs.job_status, 'Open'));

    // 2. Get total student applications count
    const [totalStudentsResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(students);

    // 3. Get shortlisted students count
    const [shortlistedCountResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(shortlistedStudents);

    // 4. Get final interview count (stage = 'final_interview')
    const [finalInterviewResult] = await db
      .select({ count: sql`count(*)::int` })
      .from(shortlistedStudents)
      .where(eq(shortlistedStudents.current_stage, 'final_interview'));

    res.status(200).json({
      success: true,
      data: {
        openJobs: openJobsResult?.count || 0,
        totalStudents: totalStudentsResult?.count || 0,
        shortlistedCount: shortlistedCountResult?.count || 0,
        finalInterviewCount: finalInterviewResult?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
