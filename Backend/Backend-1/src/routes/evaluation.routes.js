import { Router } from 'express';
import { verifyToken } from '../controllers/evaluation.controller.js';

const router = Router();

/**
 * Evaluation Routes
 * Base: /api/v1/evaluate
 *
 * Public routes — only protected by the signed JWT token embedded in the URL.
 */

// GET /api/v1/evaluate/verify?token=... — Verify candidate evaluation token
router.get('/verify', verifyToken);

export default router;
