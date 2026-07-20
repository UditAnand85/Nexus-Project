import * as adminAuthService from '../services/admin.auth.service.js';

// ─── Cookie Settings ──────────────────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/admin/login
 * Step 1: Validates credentials and sends an OTP to the admin's email.
 * Does NOT set a cookie or return a token — that happens after OTP verification.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const result = await adminAuthService.initiateLogin({ email, password });

    res.status(200).json({
      success: true,
      message: 'Credentials verified. An OTP has been sent to your email.',
      data: result, // { otpSent: true, full_name }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/admin/verify-otp
 * Step 2: Validates the OTP and issues the JWT cookie.
 */
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const { token, admin } = await adminAuthService.verifyOTPAndLogin({ email, otp });

    // Set JWT in httpOnly secure cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { admin },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/admin/logout
 * Clear the JWT cookie.
 */
export const logout = (_req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    });
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/admin/me
 * Return the currently authenticated admin's profile with role info.
 */
export const getMe = async (req, res, next) => {
  try {
    const adminData = await adminAuthService.getAdminById(req.user.id);
    res.status(200).json({ success: true, data: { admin: adminData } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/admin/forgot-password
 * Request a password reset email.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    await adminAuthService.requestAdminPasswordReset(email);

    // Always respond with success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an admin account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/admin/reset-password
 * Reset password using a valid reset token.
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new_password are required.',
      });
    }

    await adminAuthService.resetAdminPassword(token, new_password);

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};
