import {
  pgTable,
  serial,
  varchar,
  text,
  decimal,
  timestamp,
  pgEnum,
  json,
  integer,
  uuid,
} from 'drizzle-orm/pg-core';
import { jobs } from './jobs.js';

/**
 * ENUM: application_status
 * Tracks the current state of a candidate's application.
 */
export const applicationStatusEnum = pgEnum('application_status', [
  'Applied',
  'Shortlisted',
  'Rejected',
  'Hired',
]);

/**
 * STUDENTS Table
 * Stores each candidate's job application.
 * Created when a candidate submits the application form.
 *
 * NOTE on resume_url:
 *   The resume file is uploaded to S3 first, and the public URL is stored in
 *   resume_url. This URL is then passed from Backend-1 → Backend-2 via BullMQ
 *   and HTTP, and Backend-2 retrieves the resume directly from this URL.
 *   Backend-2 returns parsed data, which is stored in parsed_resume_json.
 */
export const students = pgTable('students', {
  student_id: uuid('student_id').defaultRandom().primaryKey(),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  job_id: uuid('job_id').notNull().references(() => jobs.job_id),
  resume_url: text('resume_url'), // Public URL from Supabase Storage
  parsed_resume_json: json('parsed_resume_json'), // Populated by Backend-2 result
  resume_score: decimal('resume_score', { precision: 5, scale: 2 }), // ATS score (0–100)
  application_status: applicationStatusEnum('application_status')
    .default('Applied')
    .notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
