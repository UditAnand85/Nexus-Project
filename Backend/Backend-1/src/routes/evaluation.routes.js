import { Router } from 'express';
import { verifyToken, getQuestions, submitAnswers, submitCoding } from '../controllers/evaluation.controller.js';

const router = Router();

/**
 * Evaluation Routes
 * Base: /api/v1/evaluate
 *
 * All routes are protected by the signed JWT token embedded in the URL query.
 * No session auth needed — the token IS the credential.
 */

// GET /api/v1/evaluate/verify?token=...
// Verify candidate evaluation token, returns student + job info (including coding_round_enabled)
router.get('/verify', verifyToken);

// GET /api/v1/evaluate/questions?token=...
// Fetch 20 random aptitude + 30 random technical questions (+ 3 coding problems if coding_round_enabled)
// correct_answer and test_output are NEVER sent to the client
router.get('/questions', getQuestions);

// POST /api/v1/evaluate/submit?token=...
// Submit quiz answers, calculate + store scores
// If coding_round_enabled: sets current_stage='CodingRound', returns coding_round_pending=true
// If coding_round_disabled: sets current_stage='Completed', computes final_score
router.post('/submit', submitAnswers);

// POST /api/v1/evaluate/coding?token=...
// Submit coding round results (stdout per problem)
// Compares stdout vs hidden test_output, computes coding_score + final_score
// Sets current_stage='Completed'
router.post('/coding', submitCoding);

export default router;
