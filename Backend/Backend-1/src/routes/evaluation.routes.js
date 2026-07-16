import { Router } from 'express';
import { verifyToken, getQuestions, submitAnswers } from '../controllers/evaluation.controller.js';

const router = Router();

/**
 * Evaluation Routes
 * Base: /api/v1/evaluate
 *
 * All routes are protected by the signed JWT token embedded in the URL query.
 * No session auth needed — the token IS the credential.
 */

// GET /api/v1/evaluate/verify?token=...
// Verify candidate evaluation token, returns student + job info
router.get('/verify', verifyToken);

// GET /api/v1/evaluate/questions?token=...
// Fetch 20 random aptitude + 30 random technical questions (no correct_answer)
router.get('/questions', getQuestions);

// POST /api/v1/evaluate/submit?token=...
// Submit answers, calculate + store scores
router.post('/submit', submitAnswers);

export default router;
