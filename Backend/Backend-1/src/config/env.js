import 'dotenv/config';

// ─── Validate Required Env Vars at Startup ────────────────────────────────────
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REDIS_URL',
  'INTERNAL_API_KEY',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET_NAME',
  'AWS_SES_FROM_EMAIL',
];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('\n❌  Missing required environment variables:');
  missing.forEach((key) => console.error(`    - ${key}`));
  console.error('\n📄  Please copy .env.example → .env and fill in all values.\n');
  process.exit(1);
}

// ─── Exported Config Object (Frozen) ─────────────────────────────────────────
export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // Redis / BullMQ
  REDIS_URL: process.env.REDIS_URL,

  // CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',

  // Backend-2
  BACKEND2_URL: process.env.BACKEND2_URL || 'http://localhost:5001',

  // Internal API Key (Backend-2 ↔ Backend-1)
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,

  // Seed values
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'superadmin@recruitai.com',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',

  // AWS S3
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,

  // AWS SES (Email)
  AWS_SES_FROM_EMAIL: process.env.AWS_SES_FROM_EMAIL,

  // Gemini AI (Question Bank Generation) — optional, generation silently skipped if missing
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
});
