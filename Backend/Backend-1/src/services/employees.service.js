import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { admin, roles } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = 12;

// ─── Generate a random temporary password ─────────────────────────────────────
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ─── Create Employee (Super Admin only) ───────────────────────────────────────

/**
 * Create a new admin employee with a randomly generated temp password.
 * The employee must change their password on first login.
 */
export const createEmployee = async ({ full_name, email, role_key, account_status = 'Active', department }) => {
  // Ensure email is not already taken
  const existing = await db
    .select({ admin_id: admin.admin_id })
    .from(admin)
    .where(eq(admin.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError('An account with this email already exists.', 409);
  }

  // Validate role_key exists
  const role = await db
    .select({ role_key: roles.role_key })
    .from(roles)
    .where(eq(roles.role_key, role_key))
    .limit(1);

  if (role.length === 0) {
    throw new AppError(`Role '${role_key}' does not exist.`, 400);
  }

  const tempPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);

  const [newEmployee] = await db
    .insert(admin)
    .values({
      full_name,
      email,
      password: hashedPassword,
      role_key,
      department: department || null,
      account_status,
      must_change_password: true,   // Force password change on first login
    })
    .returning({
      admin_id: admin.admin_id,
      full_name: admin.full_name,
      email: admin.email,
      role_key: admin.role_key,
      department: admin.department,
      account_status: admin.account_status,
      must_change_password: admin.must_change_password,
      created_at: admin.created_at,
    });

  return { employee: newEmployee, tempPassword };
};

// ─── List all Employees ───────────────────────────────────────────────────────

export const listEmployees = async () => {
  return await db
    .select({
      admin_id: admin.admin_id,
      full_name: admin.full_name,
      email: admin.email,
      role_key: admin.role_key,
      role_name: roles.role_name,
      department: admin.department,
      account_status: admin.account_status,
      must_change_password: admin.must_change_password,
      created_at: admin.created_at,
    })
    .from(admin)
    .leftJoin(roles, eq(admin.role_key, roles.role_key))
    .orderBy(admin.created_at);
};

// ─── First-Time Password Change ───────────────────────────────────────────────

/**
 * Allows an employee to set their own password on first login.
 * Clears the must_change_password flag after success.
 */
export const changePassword = async (adminId, { current_password, new_password }) => {
  const result = await db
    .select({ admin_id: admin.admin_id, password: admin.password, must_change_password: admin.must_change_password })
    .from(admin)
    .where(eq(admin.admin_id, adminId))
    .limit(1);

  if (result.length === 0) throw new AppError('Admin not found.', 404);

  const adminData = result[0];

  const isValid = await bcrypt.compare(current_password, adminData.password);
  if (!isValid) throw new AppError('Current password is incorrect.', 401);

  if (new_password.length < 8) {
    throw new AppError('New password must be at least 8 characters.', 400);
  }

  const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);

  await db
    .update(admin)
    .set({ password: hashed, must_change_password: false })
    .where(eq(admin.admin_id, adminId));

  return { success: true };
};
