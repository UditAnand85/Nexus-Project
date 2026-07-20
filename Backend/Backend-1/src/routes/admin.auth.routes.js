import { Router } from 'express';
import * as adminAuthController from '../controllers/admin.auth.controller.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * Admin Authentication Routes
 * Base: /api/v1/auth/admin
 *
 * Login is a 2-step flow:
 *   1. POST /login       — Validate credentials, send OTP to email
 *   2. POST /verify-otp  — Validate OTP, receive JWT cookie
 *
 * Accounts are pre-seeded by the Super Admin (no self-registration).
 */

// Step 1: Validate credentials + send OTP
router.post('/login', adminAuthController.login);

// Step 2: Verify OTP + receive session cookie
router.post('/verify-otp', adminAuthController.verifyOTP);

// POST /api/v1/auth/admin/logout
router.post('/logout', authenticateAdmin, adminAuthController.logout);

// GET /api/v1/auth/admin/me — Returns currently logged-in admin's profile + role
router.get('/me', authenticateAdmin, adminAuthController.getMe);

// POST /api/v1/auth/admin/forgot-password — Request password reset email
router.post('/forgot-password', adminAuthController.forgotPassword);

// POST /api/v1/auth/admin/reset-password — Reset password with token
router.post('/reset-password', adminAuthController.resetPassword);

export default router;
