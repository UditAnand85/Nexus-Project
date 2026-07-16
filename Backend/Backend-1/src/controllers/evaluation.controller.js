import jwt from 'jsonwebtoken';
import { eq, isNull, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { students, jobs, shortlistedStudents, aptitudeQuestions, technicalQuestions } from '../db/schema/index.js';
import { env } from '../config/env.js';

// ─── Helper: decode & verify eval token ──────────────────────────────────────

function verifyEvalToken(token) {
  if (!token) throw { status: 400, message: 'Evaluation token is required.' };
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    throw {
      status: 401,
      message: isExpired
        ? 'Your evaluation link has expired. Please contact the recruiter.'
        : 'Invalid evaluation link.',
    };
  }
}

// ─── GET /api/v1/evaluate/verify?token= ──────────────────────────────────────

/**
 * Verify candidate evaluation JWT, return student + job info.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const decoded = verifyEvalToken(req.query.token);
    const { student_id, job_id } = decoded;

    const [studentRow] = await db
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

    if (!studentRow) return res.status(404).json({ success: false, message: 'Candidate not found.' });

    const [jobRow] = await db
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

    if (!jobRow) return res.status(404).json({ success: false, message: 'Job not found.' });

    // Check if already completed
    const [shortlisted] = await db
      .select({ current_stage: shortlistedStudents.current_stage })
      .from(shortlistedStudents)
      .where(eq(shortlistedStudents.student_id, student_id))
      .limit(1);

    res.status(200).json({
      success: true,
      data: {
        student: studentRow,
        job: jobRow,
        already_completed: shortlisted?.current_stage === 'Completed',
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// ─── GET /api/v1/evaluate/questions?token= ───────────────────────────────────

/**
 * Returns 20 randomised aptitude + 30 randomised technical questions.
 * correct_answer is NEVER sent to the client.
 */
export const getQuestions = async (req, res, next) => {
  try {
    const decoded = verifyEvalToken(req.query.token);
    const { student_id, job_id } = decoded;

    // Block if already submitted
    const [shortlisted] = await db
      .select({ current_stage: shortlistedStudents.current_stage })
      .from(shortlistedStudents)
      .where(eq(shortlistedStudents.student_id, student_id))
      .limit(1);

    if (shortlisted?.current_stage === 'Completed') {
      return res.status(409).json({ success: false, message: 'You have already completed this evaluation.' });
    }

    // Fetch 20 random aptitude questions (global pool)
    const aptitude = await db
      .select({
        question_id: aptitudeQuestions.question_id,
        category: aptitudeQuestions.category,
        question: aptitudeQuestions.question,
        option_a: aptitudeQuestions.option_a,
        option_b: aptitudeQuestions.option_b,
        option_c: aptitudeQuestions.option_c,
        option_d: aptitudeQuestions.option_d,
        type: sql`'aptitude'`.as('type'),
      })
      .from(aptitudeQuestions)
      .where(isNull(aptitudeQuestions.job_id))
      .orderBy(sql`RANDOM()`)
      .limit(20);

    // Fetch 30 random technical questions for this job
    const technical = await db
      .select({
        question_id: technicalQuestions.question_id,
        category: technicalQuestions.category,
        question: technicalQuestions.question,
        option_a: technicalQuestions.option_a,
        option_b: technicalQuestions.option_b,
        option_c: technicalQuestions.option_c,
        option_d: technicalQuestions.option_d,
        type: sql`'technical'`.as('type'),
      })
      .from(technicalQuestions)
      .where(eq(technicalQuestions.job_id, job_id))
      .orderBy(sql`RANDOM()`)
      .limit(30);

    res.status(200).json({
      success: true,
      data: {
        aptitude,
        technical,
        total: aptitude.length + technical.length,
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// ─── POST /api/v1/evaluate/submit?token= ─────────────────────────────────────

/**
 * Submit evaluation answers, calculate scores, save results.
 *
 * Request body: { answers: [{ question_id, type, selected_option }] }
 *   type: 'aptitude' | 'technical'
 *   selected_option: 'A' | 'B' | 'C' | 'D'
 *
 * Scoring:
 *   aptitude_score  = (correct aptitude / 20) × 100
 *   technical_score = (correct technical / 30) × 100
 *   final_score     = 0.4 × aptitude_score + 0.6 × technical_score
 */
export const submitAnswers = async (req, res, next) => {
  try {
    const decoded = verifyEvalToken(req.query.token);
    const { student_id, job_id } = decoded;
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Answers array is required.' });
    }

    // Block duplicate submissions
    const [existing] = await db
      .select({ current_stage: shortlistedStudents.current_stage })
      .from(shortlistedStudents)
      .where(eq(shortlistedStudents.student_id, student_id))
      .limit(1);

    if (existing?.current_stage === 'Completed') {
      return res.status(409).json({ success: false, message: 'You have already submitted this evaluation.' });
    }

    // Separate answers by type
    const aptitudeAnswers = answers.filter((a) => a.type === 'aptitude');
    const technicalAnswers = answers.filter((a) => a.type === 'technical');

    // Fetch correct answers for submitted question IDs
    const aptitudeIds = aptitudeAnswers.map((a) => a.question_id);
    const technicalIds = technicalAnswers.map((a) => a.question_id);

    let aptitudeCorrect = 0;
    let technicalCorrect = 0;

    if (aptitudeIds.length > 0) {
      const correctAptitude = await db
        .select({ question_id: aptitudeQuestions.question_id, correct_answer: aptitudeQuestions.correct_answer })
        .from(aptitudeQuestions)
        .where(sql`${aptitudeQuestions.question_id} = ANY(${sql.raw(`ARRAY[${aptitudeIds.map((id) => `'${id}'`).join(',')}]::uuid[]`)})`)
      ;
      const correctMap = new Map(correctAptitude.map((q) => [q.question_id, q.correct_answer]));
      aptitudeCorrect = aptitudeAnswers.filter(
        (a) => correctMap.get(a.question_id) === (a.selected_option || '').toUpperCase()
      ).length;
    }

    if (technicalIds.length > 0) {
      const correctTechnical = await db
        .select({ question_id: technicalQuestions.question_id, correct_answer: technicalQuestions.correct_answer })
        .from(technicalQuestions)
        .where(sql`${technicalQuestions.question_id} = ANY(${sql.raw(`ARRAY[${technicalIds.map((id) => `'${id}'`).join(',')}]::uuid[]`)})`)
      ;
      const correctMap = new Map(correctTechnical.map((q) => [q.question_id, q.correct_answer]));
      technicalCorrect = technicalAnswers.filter(
        (a) => correctMap.get(a.question_id) === (a.selected_option || '').toUpperCase()
      ).length;
    }

    // Calculate scores
    const aptitudeScore = aptitudeIds.length > 0 ? (aptitudeCorrect / 20) * 100 : 0;
    const technicalScore = technicalIds.length > 0 ? (technicalCorrect / 30) * 100 : 0;
    const finalScore = parseFloat((0.4 * aptitudeScore + 0.6 * technicalScore).toFixed(2));

    // Upsert shortlisted_students record
    const shortlistedRecord = await db
      .select({ shortlisted_id: shortlistedStudents.shortlisted_id })
      .from(shortlistedStudents)
      .where(eq(shortlistedStudents.student_id, student_id))
      .limit(1);

    if (shortlistedRecord.length > 0) {
      await db.update(shortlistedStudents)
        .set({
          aptitude_score: aptitudeScore.toFixed(2),
          final_score: finalScore.toFixed(2),
          current_stage: 'Completed',
        })
        .where(eq(shortlistedStudents.student_id, student_id));
    } else {
      await db.insert(shortlistedStudents).values({
        student_id,
        aptitude_score: aptitudeScore.toFixed(2),
        final_score: finalScore.toFixed(2),
        current_stage: 'Completed',
      });
    }

    // Update student application status
    await db.update(students)
      .set({ application_status: 'Shortlisted' })
      .where(eq(students.student_id, student_id));

    res.status(200).json({
      success: true,
      data: {
        aptitude_correct: aptitudeCorrect,
        aptitude_total: Math.min(aptitudeIds.length, 20),
        aptitude_score: parseFloat(aptitudeScore.toFixed(1)),
        technical_correct: technicalCorrect,
        technical_total: Math.min(technicalIds.length, 30),
        technical_score: parseFloat(technicalScore.toFixed(1)),
        final_score: finalScore,
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};
