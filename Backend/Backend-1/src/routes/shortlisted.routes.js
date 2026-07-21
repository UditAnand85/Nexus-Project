import { Router } from 'express';
import * as shortlistedController from '../controllers/shortlisted.controller.js';
import { authenticateAdmin, verifyInternalApiKey } from '../middleware/auth.js';
import { allowAnyAdmin } from '../middleware/authorize.js';

const router = Router();

/**
 * Shortlisted Students Routes
 * Base: /api/v1/shortlisted
 *
 * - GET routes   → Admin only
 * - POST /result → Internal route (Backend-2 → Backend-1 callback, API key protected)
 */

// GET /api/v1/shortlisted — All shortlisted candidates
router.get('/', authenticateAdmin, allowAnyAdmin, shortlistedController.getAllShortlisted);

// GET /api/v1/shortlisted/job/:jobId — Shortlisted candidates for a specific job
router.get('/job/:jobId', authenticateAdmin, allowAnyAdmin, shortlistedController.getShortlistedByJob);

// GET /api/v1/shortlisted/:id — Specific shortlisted record
router.get('/:id', authenticateAdmin, allowAnyAdmin, shortlistedController.getShortlistedById);

// PATCH /api/v1/shortlisted/status — Admin manual override (invite/reject candidates regardless of score)
router.patch('/status', authenticateAdmin, allowAnyAdmin, shortlistedController.updateCandidateStatus);

// POST /api/v1/shortlisted/result
// INTERNAL: Backend-2 posts AI-processed resume results here after parsing.
// Protected by X-Internal-Api-Key header (shared secret).
router.post('/result', verifyInternalApiKey, shortlistedController.processResult);

export default router;
