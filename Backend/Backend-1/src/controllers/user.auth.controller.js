import * as userAuthService from '../services/user.auth.service.js';

// ─── Cookie Settings ──────────────────────────────────────────────────────────
// secure: true only in production (HTTPS). On localhost (http) browsers silently
// drop cookies with secure:true, so we set it to false in development.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in ms
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/user/register
 * Register a new candidate account.
 */
export const register = async (req, res, next) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and password are required.',
      });
    }

    const newUser = await userAuthService.register({ full_name, email, password, phone });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please login to continue.',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/user/login
 * Authenticate candidate and set JWT cookie.
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

    const { token, user } = await userAuthService.login({ email, password });

    // Set JWT in httpOnly secure cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/user/logout
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
 * GET /api/v1/auth/user/me
 * Return the currently authenticated user's profile.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await userAuthService.getUserById(req.user.id);
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/me/applications
 * Retrieve currently logged-in candidate's job applications.
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await userAuthService.getMyApplications(req.user.email);
    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/user/forgot-password
 * Request a password reset email for a candidate account.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    await userAuthService.requestUserPasswordReset(email);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/user/reset-password
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

    await userAuthService.resetUserPassword(token, new_password);

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

