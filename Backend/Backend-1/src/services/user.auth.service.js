import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq, desc } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users, students, jobs, shortlistedStudents } from '../db/schema/index.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '../config/ses.js';


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

    })
    .from(students)
    .innerJoin(jobs, eq(students.job_id, jobs.job_id))
    .leftJoin(shortlistedStudents, eq(students.student_id, shortlistedStudents.student_id))
    .where(eq(students.email, email))
    .orderBy(desc(students.created_at));
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

/**
 * Generates a secure reset token, stores it in the DB with a 1-hour expiry,
 * and sends a password reset email to the user.
 *
 * Always returns success (even if email not found) to prevent email enumeration.
 */
export const requestUserPasswordReset = async (email) => {
  const result = await db
    .select({ user_id: users.user_id, full_name: users.full_name, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) return; // Silently succeed

  const userData = result[0];
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .update(users)
    .set({ reset_token: token, reset_token_expires_at: expiresAt })
    .where(eq(users.user_id, userData.user_id));

  const resetUrl = `${env.PRIMARY_CLIENT_URL}/reset-password?token=${token}&type=student`;
  sendUserPasswordResetEmail({ email: userData.email, full_name: userData.full_name, resetUrl }).catch(
    (err) => console.error('[User Reset Email] Failed:', err.message)
  );
};

/**
 * Validates the reset token and updates the user's password.
 * Clears the token after use.
 */
export const resetUserPassword = async (token, newPassword) => {
  const result = await db
    .select({
      user_id: users.user_id,
      reset_token: users.reset_token,
      reset_token_expires_at: users.reset_token_expires_at,
    })
    .from(users)
    .where(eq(users.reset_token, token))
    .limit(1);

  if (result.length === 0) {
    throw new AppError('Invalid or expired reset link.', 400);
  }

  const userData = result[0];

  if (!userData.reset_token_expires_at || new Date() > userData.reset_token_expires_at) {
    throw new AppError('Reset link has expired. Please request a new one.', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters.', 400);
  }

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db
    .update(users)
    .set({ password: hashed, reset_token: null, reset_token_expires_at: null })
    .where(eq(users.user_id, userData.user_id));
};

// ─── Email Helper ─────────────────────────────────────────────────────────────

const sendUserPasswordResetEmail = async ({ email, full_name, resetUrl }) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#F5F5F1;font-family:'Work Sans',Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F1;padding:40px 16px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E4E4DC;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0F0F0E;padding:22px 28px;">
                <span style="color:#FFFFFF;font-size:16px;font-weight:600;">RecruitAI · Password Reset</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 24px;">
                <p style="margin:0 0 6px;font-size:12px;color:#9B9B8C;letter-spacing:0.06em;text-transform:uppercase;font-family:monospace;">Candidate Account</p>
                <h1 style="margin:0 0 16px;font-size:22px;color:#0F0F0E;font-weight:600;">Reset your password, ${full_name.split(' ')[0]}</h1>
                <p style="margin:0 0 24px;font-size:14px;color:#555550;line-height:1.7;">
                  We received a request to reset your RecruitAI account password.
                  Click the button below — this link expires in <strong>1 hour</strong>.
                </p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#2C3B8F;border-radius:8px;">
                      <a href="${resetUrl}" style="display:inline-block;padding:13px 28px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">Reset Password →</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0;font-size:12px;color:#9B9B8C;">
                  Or copy this link: <span style="font-family:monospace;word-break:break-all;">${resetUrl}</span>
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;">
                  <tr>
                    <td style="padding:12px 16px;font-size:12px;color:#92400E;line-height:1.6;">
                      ⚠️ If you didn't request this reset, you can safely ignore this email. Your password won't change.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #E4E4DC;">
                <p style="margin:0;font-size:11px;color:#9B9B8C;">Sent to ${email}. This link expires in 1 hour.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const command = new SendEmailCommand({
    Source: env.AWS_SES_FROM_EMAIL,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: 'Reset your RecruitAI password', Charset: 'UTF-8' },
      Body: { Html: { Data: emailHtml, Charset: 'UTF-8' } },
    },
  });

  await sesClient.send(command);
  console.log(`[User Reset Email] Sent to ${email}`);
};

