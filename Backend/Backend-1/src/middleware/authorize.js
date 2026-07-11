import { AppError } from './errorHandler.js';

/**
 * Role key constants.
 * Match the role_key values seeded into the ROLES table.
 */
export const ROLES = Object.freeze({
  SUPER_ADMIN: 'R001',
  HR_MANAGER: 'R002',
  HIRING_MANAGER: 'R003',
  VIEWER: 'R004',
});

// ─── Permission Groups ────────────────────────────────────────────────────────

/** All admin roles — for read-only routes */
const ALL_ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.HR_MANAGER,
  ROLES.HIRING_MANAGER,
  ROLES.VIEWER,
];

/** Roles that can create/update/delete jobs */
const WRITE_ROLES = [ROLES.SUPER_ADMIN, ROLES.HR_MANAGER, ROLES.HIRING_MANAGER];

// ─── Role-Based Authorization Middleware Factory ──────────────────────────────

/**
 * Returns middleware that checks whether the authenticated admin has one of the allowed roles.
 * Must be used AFTER authenticateAdmin middleware.
 *
 * @param {...string} allowedRoles - Role keys that are permitted
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.post('/jobs', authenticateAdmin, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.HR_MANAGER), createJob);
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (req.user.userType !== 'admin') {
      return next(new AppError('Admin access required.', 403));
    }

    if (!allowedRoles.includes(req.user.role_key)) {
      return next(
        new AppError(
          `Access denied. Your role (${req.user.role_name || req.user.role_key}) does not have permission for this action.`,
          403
        )
      );
    }

    next();
  };
};

// ─── Shorthand Middleware Exports ─────────────────────────────────────────────

/** Allows any authenticated admin (read-only) */
export const allowAnyAdmin = authorizeRoles(...ALL_ADMIN_ROLES);

/** Allows only roles with write access (Super Admin, HR Manager, Hiring Manager) */
export const allowWriteAccess = authorizeRoles(...WRITE_ROLES);

/** Allows Super Admin only */
export const allowSuperAdminOnly = authorizeRoles(ROLES.SUPER_ADMIN);
