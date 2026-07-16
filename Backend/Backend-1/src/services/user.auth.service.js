import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users, students, jobs, shortlistedStudents } from '../db/schema/index.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = 12;

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Register a new candidate.
 * Throws AppError if email already exists.
 */
export const register = async ({ full_name, email, password, phone }) => {
  // Check for existing email
  const existing = await db
    .select({ user_id: users.user_id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new AppError('Email already exists. Please login or use a different email.', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert new user — return only safe fields (no password)
  const [newUser] = await db
    .insert(users)
    .values({ full_name, email, password: hashedPassword, phone: phone || null })
    .returning({
      user_id: users.user_id,
      full_name: users.full_name,
      email: users.email,
      phone: users.phone,
      created_at: users.created_at,
    });

  return newUser;
};

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Authenticate a candidate and return JWT token + user info.
 * Throws AppError for invalid email or wrong password.
 */
export const login = async ({ email, password }) => {
  // Find user by email
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) {
    throw new AppError('Email does not exist. Please register first.', 404);
  }

  const user = result[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError('Invalid credentials. Incorrect password.', 401);
  }

  // Sign JWT
  const token = jwt.sign(
    { id: user.user_id, email: user.email, userType: 'user' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
    },
  };
};

// ─── Get By ID ────────────────────────────────────────────────────────────────

/**
 * Fetch user profile by ID (no password returned).
 */
export const getUserById = async (userId) => {
  const result = await db
    .select({
      user_id: users.user_id,
      full_name: users.full_name,
      email: users.email,
      phone: users.phone,
      created_at: users.created_at,
    })
    .from(users)
    .where(eq(users.user_id, userId))
    .limit(1);

  if (result.length === 0) {
    throw new AppError('User not found.', 404);
  }

  return result[0];
};

// ─── Get Candidate Applications ───────────────────────────────────────────────

export const getMyApplications = async (email) => {
  return await db
    .select({
      student_id: students.student_id,
      email: students.email,
      full_name: students.full_name,
      phone: students.phone,

      resume_score: students.resume_score,
      application_status: students.application_status,
      created_at: students.created_at,
      job_id: students.job_id,
      job_title: jobs.job_title,
      aptitude_score: shortlistedStudents.aptitude_score,
      final_score: shortlistedStudents.final_score,
      current_stage: shortlistedStudents.current_stage,
      recommendation: shortlistedStudents.recommendation,
    })
    .from(students)
    .innerJoin(jobs, eq(students.job_id, jobs.job_id))
    .leftJoin(shortlistedStudents, eq(students.student_id, shortlistedStudents.student_id))
    .where(eq(students.email, email))
    .orderBy(desc(students.created_at));
};
