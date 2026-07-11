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
 *   The resume file is NOT stored permanently. It is transferred from
 *   Backend-1 → Backend-2 via BullMQ as a base64-encoded payload.
 *   Backend-2 returns parsed data, which is stored in parsed_resume_json.
 *   resume_url is kept in the schema for compliance but will remain null.
 */
export const students = pgTable('students', {
  student_id: serial('student_id').primaryKey(),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  job_id: integer('job_id').notNull().references(() => jobs.job_id),
  resume_url: text('resume_url'),               // Nullable — resume is not persisted
  parsed_resume_json: json('parsed_resume_json'), // Populated by Backend-2 result
  resume_score: decimal('resume_score', { precision: 5, scale: 2 }), // ATS score (0–100)
  application_status: applicationStatusEnum('application_status')
    .default('Applied')
    .notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
