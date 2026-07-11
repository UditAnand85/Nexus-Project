import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { admin, roles } from '../db/schema/index.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Authenticate an admin and return JWT token + admin info with role.
 *
 * Throws AppError for:
 * - Email not found
 * - Account inactive
 * - Wrong password
 */
export const login = async ({ email, password }) => {
  // Fetch admin with role info via join
  const result = await db
    .select({
      admin_id: admin.admin_id,
      full_name: admin.full_name,
      email: admin.email,
      password: admin.password,
      role_key: admin.role_key,
      role_name: roles.role_name,
      department: admin.department,
      phone: admin.phone,
      account_status: admin.account_status,
    })
    .from(admin)
    .leftJoin(roles, eq(admin.role_key, roles.role_key))
    .where(eq(admin.email, email))
    .limit(1);

  if (result.length === 0) {
    throw new AppError('Email does not exist.', 404);
  }

  const adminData = result[0];

  // Check account is active
  if (adminData.account_status !== 'Active') {
    throw new AppError(
      'Your account has been deactivated. Please contact the Super Admin.',
      403
    );
  }

  // Verify password
  const isValid = await bcrypt.compare(password, adminData.password);
  if (!isValid) {
    throw new AppError('Invalid credentials. Incorrect password.', 401);
  }

  // Sign JWT — include role info so middleware can authorize without a DB hit
  const token = jwt.sign(
    {
      id: adminData.admin_id,
      email: adminData.email,
      role_key: adminData.role_key,
      role_name: adminData.role_name,
      userType: 'admin',
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    admin: {
      admin_id: adminData.admin_id,
      full_name: adminData.full_name,
      email: adminData.email,
      role_key: adminData.role_key,
      role_name: adminData.role_name,
      department: adminData.department,
    },
  };
};

// ─── Get By ID ────────────────────────────────────────────────────────────────

/**
 * Fetch admin profile by ID, joined with role name.
 * Password is never returned.
 */
export const getAdminById = async (adminId) => {
  const result = await db
    .select({
      admin_id: admin.admin_id,
      full_name: admin.full_name,
      email: admin.email,
      role_key: admin.role_key,
      role_name: roles.role_name,
      department: admin.department,
      phone: admin.phone,
      account_status: admin.account_status,
      created_at: admin.created_at,
    })
    .from(admin)
    .leftJoin(roles, eq(admin.role_key, roles.role_key))
    .where(eq(admin.admin_id, adminId))
    .limit(1);

  if (result.length === 0) {
    throw new AppError('Admin not found.', 404);
  }

  return result[0];
};
