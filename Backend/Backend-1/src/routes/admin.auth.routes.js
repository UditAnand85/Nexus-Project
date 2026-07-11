import { Router } from 'express';
import * as adminAuthController from '../controllers/admin.auth.controller.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * Admin Authentication Routes
 * Base: /api/v1/auth/admin
 *
 * Note: Admins cannot self-register. Accounts are pre-seeded by the Super Admin.
 */

// POST /api/v1/auth/admin/login
router.post('/login', adminAuthController.login);

// POST /api/v1/auth/admin/logout
router.post('/logout', authenticateAdmin, adminAuthController.logout);

// GET /api/v1/auth/admin/me — Returns currently logged-in admin's profile + role
router.get('/me', authenticateAdmin, adminAuthController.getMe);

export default router;
