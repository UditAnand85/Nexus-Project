import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { admin, roles } from '../db/schema/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '../config/ses.js';
import { env } from '../config/env.js';

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

// ─── Send Admin Welcome Email via SES ─────────────────────────────────────────

/**
 * Sends a welcome / access-granted email to a newly created admin employee.
 * Includes their temporary password and instructs them to change it on first login.
 */
export const sendAdminWelcomeEmail = async ({ full_name, email, role_name, tempPassword }) => {
  const loginUrl = `${env.PRIMARY_CLIENT_URL}/admin-login`;

  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#F5F5F1;font-family:'Work Sans',Helvetica,Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F1;padding:40px 16px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E4E4DC;border-radius:12px;overflow:hidden;">

            <!-- Header -->
            <tr>
              <td style="background:#0F0F0E;padding:24px 32px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#2C3B8F;border-radius:6px;width:28px;height:28px;text-align:center;vertical-align:middle;">
                      <span style="color:#FFFFFF;font-family:monospace;font-weight:700;font-size:11px;">RA</span>
                    </td>
                    <td style="padding-left:10px;">
                      <span style="color:#FFFFFF;font-size:17px;font-weight:600;">RecruitAI</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 32px 28px;">
                <p style="margin:0 0 6px;font-size:12px;color:#9B9B8C;letter-spacing:0.06em;text-transform:uppercase;font-family:monospace;">Admin Access Granted</p>
                <h1 style="margin:0 0 20px;font-size:24px;color:#0F0F0E;font-weight:600;">Welcome to RecruitAI, ${full_name.split(' ')[0]}!</h1>

                <p style="margin:0 0 16px;font-size:14px;color:#555550;line-height:1.7;">
                  A Super Admin has created an admin account for you on the RecruitAI hiring platform.
                  Your role is <strong style="color:#0F0F0E;">${role_name || 'Admin'}</strong>.
                </p>

                <p style="margin:0 0 8px;font-size:13px;color:#9B9B8C;">Your login credentials:</p>

                <!-- Credentials box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F9F7;border:1px solid #E4E4DC;border-radius:8px;margin-bottom:24px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td style="font-size:12px;color:#9B9B8C;font-family:monospace;padding-bottom:4px;">EMAIL</td>
                        </tr>
                        <tr>
                          <td style="font-size:14px;color:#0F0F0E;font-weight:500;padding-bottom:14px;">${email}</td>
                        </tr>
                        <tr>
                          <td style="font-size:12px;color:#9B9B8C;font-family:monospace;padding-bottom:4px;">TEMPORARY PASSWORD</td>
                        </tr>
                        <tr>
                          <td>
                            <span style="display:inline-block;background:#0F0F0E;color:#F5F5F1;font-family:monospace;font-size:15px;font-weight:600;letter-spacing:0.04em;padding:8px 14px;border-radius:6px;">${tempPassword}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- CTA -->
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#2C3B8F;border-radius:8px;">
                      <a href="${loginUrl}" style="display:inline-block;padding:12px 24px;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;">Sign in &amp; Set Password →</a>
                    </td>
                  </tr>
                </table>

                <!-- Warning -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;">
                  <tr>
                    <td style="padding:14px 18px;font-size:13px;color:#92400E;line-height:1.6;">
                      ⚠️ <strong>Important:</strong> You will be asked to set a new personal password immediately after signing in.
                      The temporary password above will no longer work once you've changed it.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #E4E4DC;">
                <p style="margin:0;font-size:12px;color:#9B9B8C;">
                  This email was sent automatically by RecruitAI. If you weren't expecting this, please contact your Super Admin.
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
      Subject: { Data: 'You have been granted Admin access to RecruitAI', Charset: 'UTF-8' },
      Body: { Html: { Data: emailHtml, Charset: 'UTF-8' } },
    },
  });

  try {
    await sesClient.send(command);
    console.log(`[Admin Welcome Email] Sent to ${email}`);
  } catch (err) {
    // Non-fatal: log the error but don't block the employee creation response
    console.error(`[Admin Welcome Email] Failed to send to ${email}:`, err.message);
  }
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
