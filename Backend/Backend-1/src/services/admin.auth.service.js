import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { admin, roles } from '../db/schema/index.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '../config/ses.js';

const SALT_ROUNDS = 12;

// ─── In-memory OTP store (email → { otp, expiresAt }) ────────────────────────
// Uses a Map with TTL — lightweight and effective for single-instance deployments.
// For multi-instance/production, swap for Redis.
const otpStore = new Map();
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Step 1: Verify credentials, generate & send OTP ─────────────────────────

/**
 * Validates email + password for an admin.
 * On success, generates a 6-digit OTP, stores it in memory, and emails it.
 * Does NOT issue a JWT — that happens after OTP verification.
 *
 * Throws AppError for:
 * - Email not found / account inactive / wrong password
 */
export const initiateLogin = async ({ email, password }) => {
  // Fetch admin with role info
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
      must_change_password: admin.must_change_password,
    })
    .from(admin)
    .leftJoin(roles, eq(admin.role_key, roles.role_key))
    .where(eq(admin.email, email))
    .limit(1);

  if (result.length === 0) {
    throw new AppError('Email does not exist.', 404);
  }

  const adminData = result[0];

  if (adminData.account_status !== 'Active') {
    throw new AppError(
      'Your account has been deactivated. Please contact the Super Admin.',
      403
    );
  }

  const isValid = await bcrypt.compare(password, adminData.password);
  if (!isValid) {
    throw new AppError('Invalid credentials. Incorrect password.', 401);
  }

  // Generate OTP and store it
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  otpStore.set(email, { otp, expiresAt: Date.now() + OTP_TTL_MS });

  // Send OTP email (non-blocking — errors are logged, not thrown)
  sendOTPEmail({ email, full_name: adminData.full_name, otp }).catch((err) =>
    console.error('[Admin OTP Email] Failed:', err.message)
  );

  return { otpSent: true, full_name: adminData.full_name };
};

// ─── Step 2: Verify OTP and issue JWT ─────────────────────────────────────────

/**
 * Validates the submitted OTP for the given email.
 * On success, issues a JWT and returns the admin profile.
 */
export const verifyOTPAndLogin = async ({ email, otp }) => {
  const record = otpStore.get(email);

  if (!record) {
    throw new AppError('OTP not found. Please request a new one.', 400);
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    throw new AppError('OTP has expired. Please log in again to receive a new one.', 400);
  }

  if (record.otp !== String(otp)) {
    throw new AppError('Incorrect OTP. Please try again.', 401);
  }

  // OTP valid — clear it immediately (single-use)
  otpStore.delete(email);

  // Fetch full admin profile to build token
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
      must_change_password: admin.must_change_password,
    })
    .from(admin)
    .leftJoin(roles, eq(admin.role_key, roles.role_key))
    .where(eq(admin.email, email))
    .limit(1);

  if (result.length === 0) throw new AppError('Admin not found.', 404);

  const adminData = result[0];

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
      must_change_password: adminData.must_change_password,
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

// ─── Forgot Password ──────────────────────────────────────────────────────────

/**
 * Generates a secure reset token, stores it in the DB with a 1-hour expiry,
 * and sends a password reset email to the admin.
 *
 * Always returns success (even if email not found) to prevent email enumeration.
 */
export const requestAdminPasswordReset = async (email) => {
  const result = await db
    .select({ admin_id: admin.admin_id, full_name: admin.full_name, email: admin.email })
    .from(admin)
    .where(eq(admin.email, email))
    .limit(1);

  // Silently succeed even if email doesn't exist (prevents enumeration)
  if (result.length === 0) return;

  const adminData = result[0];
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .update(admin)
    .set({ reset_token: token, reset_token_expires_at: expiresAt })
    .where(eq(admin.admin_id, adminData.admin_id));

  const resetUrl = `${env.PRIMARY_CLIENT_URL}/reset-password?token=${token}&type=admin`;
  sendPasswordResetEmail({ email: adminData.email, full_name: adminData.full_name, resetUrl }).catch(
    (err) => console.error('[Admin Reset Email] Failed:', err.message)
  );
};

/**
 * Validates the reset token and updates the admin's password.
 * Clears the token after use.
 */
export const resetAdminPassword = async (token, newPassword) => {
  const result = await db
    .select({
      admin_id: admin.admin_id,
      reset_token: admin.reset_token,
      reset_token_expires_at: admin.reset_token_expires_at,
    })
    .from(admin)
    .where(eq(admin.reset_token, token))
    .limit(1);

  if (result.length === 0) {
    throw new AppError('Invalid or expired reset link.', 400);
  }

  const adminData = result[0];

  if (!adminData.reset_token_expires_at || new Date() > adminData.reset_token_expires_at) {
    throw new AppError('Reset link has expired. Please request a new one.', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters.', 400);
  }

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await db
    .update(admin)
    .set({
      password: hashed,
      reset_token: null,
      reset_token_expires_at: null,
      must_change_password: false,
    })
    .where(eq(admin.admin_id, adminData.admin_id));
};

// ─── Email Helpers ────────────────────────────────────────────────────────────

const sendOTPEmail = async ({ email, full_name, otp }) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#F5F5F1;font-family:'Work Sans',Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F1;padding:40px 16px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E4E4DC;border-radius:12px;overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background:#0F0F0E;padding:22px 28px;">
                <span style="color:#FFFFFF;font-size:16px;font-weight:600;">RecruitAI · Admin Verification</span>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 28px 24px;">
                <p style="margin:0 0 6px;font-size:12px;color:#9B9B8C;letter-spacing:0.06em;text-transform:uppercase;font-family:monospace;">Login OTP</p>
                <h1 style="margin:0 0 16px;font-size:22px;color:#0F0F0E;font-weight:600;">Hi ${full_name.split(' ')[0]}, here's your OTP</h1>
                <p style="margin:0 0 20px;font-size:14px;color:#555550;line-height:1.7;">
                  Use this one-time code to complete your admin login. It expires in <strong>5 minutes</strong>.
                </p>

                <!-- OTP Box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F9F7;border:1px solid #E4E4DC;border-radius:8px;margin-bottom:20px;">
                  <tr>
                    <td style="padding:20px;text-align:center;">
                      <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:0.18em;color:#0F0F0E;background:#0F0F0E;color:#F5F5F1;padding:12px 28px;border-radius:8px;display:inline-block;">${otp}</span>
                    </td>
                  </tr>
                </table>

                <!-- Warning -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;">
                  <tr>
                    <td style="padding:12px 16px;font-size:12px;color:#92400E;line-height:1.6;">
                      ⚠️ <strong>Never share this code.</strong> RecruitAI staff will never ask for your OTP.
                      If you didn't request this, your account credentials may be compromised.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #E4E4DC;">
                <p style="margin:0;font-size:11px;color:#9B9B8C;">
                  This OTP was requested for ${email}. It expires at ${new Date(Date.now() + OTP_TTL_MS).toLocaleTimeString()}.
                </p>
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
      Subject: { Data: `${otp} — Your RecruitAI admin login OTP`, Charset: 'UTF-8' },
      Body: { Html: { Data: emailHtml, Charset: 'UTF-8' } },
    },
  });

  await sesClient.send(command);
  console.log(`[Admin OTP Email] Sent to ${email}`);
};

const sendPasswordResetEmail = async ({ email, full_name, resetUrl }) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#F5F5F1;font-family:'Work Sans',Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F1;padding:40px 16px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E4E4DC;border-radius:12px;overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background:#0F0F0E;padding:22px 28px;">
                <span style="color:#FFFFFF;font-size:16px;font-weight:600;">RecruitAI · Password Reset</span>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 28px 24px;">
                <p style="margin:0 0 6px;font-size:12px;color:#9B9B8C;letter-spacing:0.06em;text-transform:uppercase;font-family:monospace;">Admin Account</p>
                <h1 style="margin:0 0 16px;font-size:22px;color:#0F0F0E;font-weight:600;">Reset your password, ${full_name.split(' ')[0]}</h1>
                <p style="margin:0 0 24px;font-size:14px;color:#555550;line-height:1.7;">
                  We received a request to reset the password for your RecruitAI admin account.
                  Click the button below — this link expires in <strong>1 hour</strong>.
                </p>

                <!-- CTA -->
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

                <!-- Warning -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;">
                  <tr>
                    <td style="padding:12px 16px;font-size:12px;color:#92400E;line-height:1.6;">
                      ⚠️ If you didn't request this reset, you can safely ignore this email. Your password won't change.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 28px;border-top:1px solid #E4E4DC;">
                <p style="margin:0;font-size:11px;color:#9B9B8C;">
                  This email was sent to ${email}. This link expires in 1 hour.
                </p>
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
      Subject: { Data: 'Reset your RecruitAI admin password', Charset: 'UTF-8' },
      Body: { Html: { Data: emailHtml, Charset: 'UTF-8' } },
    },
  });

  await sesClient.send(command);
  console.log(`[Admin Reset Email] Sent to ${email}`);
};
