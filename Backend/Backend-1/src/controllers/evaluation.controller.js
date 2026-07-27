import jwt from 'jsonwebtoken';
import { eq, isNull, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import {
  students,
  jobs,
  shortlistedStudents,
  aptitudeQuestions,
  technicalQuestions,
  codingQuestions,
} from '../db/schema/index.js';
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
 * Verify candidate evaluation JWT, return student + job info (including coding_round_enabled).
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
        coding_round_enabled: jobs.coding_round_enabled,
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
 * If coding_round_enabled=true, also returns the 3 coding problems (without test_output/test_input).
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

    // Fetch job to check coding_round_enabled
    const [jobRow] = await db
      .select({ coding_round_enabled: jobs.coding_round_enabled })
      .from(jobs)
      .where(eq(jobs.job_id, job_id))
      .limit(1);

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

    // Fetch coding problems if coding round is enabled (exclude hidden test_input/test_output)
    let coding = [];
    if (jobRow?.coding_round_enabled) {
      coding = await db
        .select({
          question_id: codingQuestions.question_id,
          title: codingQuestions.title,
          description: codingQuestions.description,
          sample_input: codingQuestions.sample_input,
          sample_output: codingQuestions.sample_output,
          difficulty: codingQuestions.difficulty,
          language_hint: codingQuestions.language_hint,
          // NOTE: test_input and test_output intentionally excluded — never sent to client
        })
        .from(codingQuestions)
        .where(eq(codingQuestions.job_id, job_id))
        .limit(3);
    }

    res.status(200).json({
      success: true,
      data: {
        aptitude,
        technical,
        coding,
        coding_round_enabled: jobRow?.coding_round_enabled ?? false,
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
 * Scoring (coding_round_enabled = false):
 *   aptitude_score  = (correct aptitude / 20) × 100
 *   technical_score = (correct technical / 30) × 100
 *   final_score     = 0.4 × aptitude_score + 0.6 × technical_score
 *
 * Scoring (coding_round_enabled = true):
 *   After quiz submit → current_stage = 'CodingRound' (not Completed yet)
 *   Final score computed in submitCoding after coding round finishes.
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

    // Check coding_round_enabled on this job
    const [jobRow] = await db
      .select({ coding_round_enabled: jobs.coding_round_enabled })
      .from(jobs)
      .where(eq(jobs.job_id, job_id))
      .limit(1);

    const hasCodingRound = jobRow?.coding_round_enabled ?? false;

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

    // Calculate quiz scores
    const aptitudeScore = aptitudeIds.length > 0 ? (aptitudeCorrect / 20) * 100 : 0;
    const technicalScore = technicalIds.length > 0 ? (technicalCorrect / 30) * 100 : 0;

    if (hasCodingRound) {
      // Save aptitude + technical scores; defer final_score calculation until after coding round
      const shortlistedRecord = await db
        .select({ shortlisted_id: shortlistedStudents.shortlisted_id })
        .from(shortlistedStudents)
        .where(eq(shortlistedStudents.student_id, student_id))
        .limit(1);

      if (shortlistedRecord.length > 0) {
        await db.update(shortlistedStudents)
          .set({
            aptitude_score: aptitudeScore.toFixed(2),
            // final_score stays null until coding round submit
            current_stage: 'CodingRound',
          })
          .where(eq(shortlistedStudents.student_id, student_id));
      } else {
        await db.insert(shortlistedStudents).values({
          student_id,
          aptitude_score: aptitudeScore.toFixed(2),
          current_stage: 'CodingRound',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          aptitude_correct: aptitudeCorrect,
          aptitude_total: Math.min(aptitudeIds.length, 20),
          aptitude_score: parseFloat(aptitudeScore.toFixed(1)),
          technical_correct: technicalCorrect,
          technical_total: Math.min(technicalIds.length, 30),
          technical_score: parseFloat(technicalScore.toFixed(1)),
          coding_round_pending: true, // signal frontend to show coding screen
          final_score: null,
          // Store technical score in response for frontend to forward to coding submit
          _technical_score: parseFloat(technicalScore.toFixed(2)),
        },
      });
    }

    // No coding round — compute and save final score immediately
    const finalScore = parseFloat((0.4 * aptitudeScore + 0.6 * technicalScore).toFixed(2));

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
        coding_round_pending: false,
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// ─── POST /api/v1/evaluate/coding?token= ─────────────────────────────────────

/**
 * Submit coding round results.
 *
 * The client runs each problem's code via Piston API and sends back the stdout.
 * We compare that stdout against the stored test_output for each question_id.
 *
 * Request body:
 *   { submissions: [{ question_id, stdout }], technical_score: number }
 *
 * Scoring:
 *   coding_score  = (passed / 3) × 100
 *   final_score   = 0.30 × aptitude_score + 0.40 × technical_score + 0.30 × coding_score
 */
export const submitCoding = async (req, res, next) => {
  try {
    const decoded = verifyEvalToken(req.query.token);
    const { student_id, job_id } = decoded;
    const { submissions, technical_score: technicalScoreFromClient } = req.body;

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return res.status(400).json({ success: false, message: 'Submissions array is required.' });
    }

    // Block if already completed
    const [existing] = await db
      .select({ current_stage: shortlistedStudents.current_stage, aptitude_score: shortlistedStudents.aptitude_score })
      .from(shortlistedStudents)
      .where(eq(shortlistedStudents.student_id, student_id))
      .limit(1);

    if (existing?.current_stage === 'Completed') {
      return res.status(409).json({ success: false, message: 'You have already submitted this evaluation.' });
    }

    // Fetch the hidden test_output for each submitted question
    const questionIds = submissions.map((s) => s.question_id).filter(Boolean);

    let codingCorrect = 0;

    if (questionIds.length > 0) {
      const correctAnswers = await db
        .select({
          question_id: codingQuestions.question_id,
          test_output: codingQuestions.test_output,
        })
        .from(codingQuestions)
        .where(sql`${codingQuestions.question_id} = ANY(${sql.raw(`ARRAY[${questionIds.map((id) => `'${id}'`).join(',')}]::uuid[]`)})`);

      const answerMap = new Map(correctAnswers.map((q) => [q.question_id, q.test_output]));

      for (const sub of submissions) {
        const expected = answerMap.get(sub.question_id);
        if (expected !== undefined) {
          const studentOut = (sub.stdout || '').trim().replace(/\r\n/g, '\n');
          const expectedOut = expected.trim().replace(/\r\n/g, '\n');
          if (studentOut === expectedOut) codingCorrect++;
        }
      }
    }

    const codingScore = (codingCorrect / 3) * 100;

    // Retrieve aptitude_score from existing shortlisted record
    const aptitudeScore = parseFloat(existing?.aptitude_score || 0);
    const technicalScore = parseFloat(technicalScoreFromClient || 0);

    // Final score: 0.30 × aptitude + 0.40 × technical + 0.30 × coding
    const finalScore = parseFloat(
      (0.3 * aptitudeScore + 0.4 * technicalScore + 0.3 * codingScore).toFixed(2)
    );

    // Update shortlisted record
    await db.update(shortlistedStudents)
      .set({
        coding_score: codingScore.toFixed(2),
        final_score: finalScore.toFixed(2),
        current_stage: 'Completed',
      })
      .where(eq(shortlistedStudents.student_id, student_id));

    // Update student application status
    await db.update(students)
      .set({ application_status: 'Shortlisted' })
      .where(eq(students.student_id, student_id));

    res.status(200).json({
      success: true,
      data: {
        coding_passed: codingCorrect,
        coding_total: 3,
        coding_score: parseFloat(codingScore.toFixed(1)),
        aptitude_score: aptitudeScore,
        technical_score: technicalScore,
        final_score: finalScore,
      },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};
