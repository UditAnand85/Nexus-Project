import { Router } from 'express';
import * as userAuthController from '../controllers/user.auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * User (Candidate) Auth Routes
 * Base: /api/v1/auth/user
 */

// POST /api/v1/auth/user/register — Register a new candidate
router.post('/register', userAuthController.register);

// POST /api/v1/auth/user/login — Authenticate candidate
router.post('/login', userAuthController.login);

// POST /api/v1/auth/user/logout — Clear JWT cookie
router.post('/logout', authenticateToken, userAuthController.logout);

// GET /api/v1/auth/user/me — Get profile
router.get('/me', authenticateToken, userAuthController.getMe);

export default router;
