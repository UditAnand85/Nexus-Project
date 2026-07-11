import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

/**
 * Verifies the JWT from the httpOnly cookie.
 * Attaches the decoded payload to req.user.
 *
 * Token payload structure:
 *   - Users (candidates):  { id, email, userType: 'user' }
 *   - Admins:              { id, email, role_key, role_name, userType: 'admin' }
 */
export const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next(new AppError('Access denied. Please login to continue.', 401));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please login again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }
};

/**
 * Extends authenticateToken — additionally enforces that the caller is an admin.
 * Use this on all admin-only routes.
 */
export const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, (err) => {
    if (err) return next(err);

    if (req.user.userType !== 'admin') {
      return next(new AppError('Admin access required.', 403));
    }

    next();
  });
};

/**
 * Validates the X-Internal-Api-Key header.
 * Used to protect the Backend-2 → Backend-1 result callback endpoint.
 * Only Backend-2 (which knows the shared secret) can call this route.
 */
export const verifyInternalApiKey = (req, res, next) => {
  const apiKey = req.headers['x-internal-api-key'];

  if (!apiKey || apiKey !== env.INTERNAL_API_KEY) {
    return next(new AppError('Invalid or missing internal API key.', 401));
  }

  next();
};
