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
 * Authenticate an admin employee and set JWT cookie.
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

    const { token, admin } = await adminAuthService.login({ email, password });

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
