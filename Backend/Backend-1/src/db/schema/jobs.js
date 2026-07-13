import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  date,
  timestamp,
  pgEnum,
  uuid,
} from 'drizzle-orm/pg-core';
import { admin } from './admin.js';

/**
 * ENUM: job_status
 * Lifecycle states of a job posting.
 * - Open: Accepting applications
 * - Closed: No longer accepting applications
 * - Shortlisting Closed: AI shortlisting has been stopped (triggered by admin)
 */
export const jobStatusEnum = pgEnum('job_status', [
  'Open',
  'Closed',
  'Shortlisting Closed',
  'Evaluation Started',
]);

/**
 * JOBS Table
 * Stores all job postings created by authorized admins.
 * Each job can have a custom AI evaluation prompt and cutoff score.
 */
export const jobs = pgTable('jobs', {
  job_id: uuid('job_id').defaultRandom().primaryKey(),
  job_title: varchar('job_title', { length: 255 }).notNull(),
  job_description: text('job_description').notNull(),
  expected_ctc: varchar('expected_ctc', { length: 100 }),
  job_location: varchar('job_location', { length: 255 }),
  employment_type: varchar('employment_type', { length: 50 }), // Full-Time / Internship
  openings: integer('openings').default(1).notNull(),
  application_start_date: date('application_start_date'),
  application_end_date: date('application_end_date'),
  job_status: jobStatusEnum('job_status').default('Open').notNull(),
  resume_cutoff_score: integer('resume_cutoff_score').default(0), // 0–100
  evaluation_prompt: text('evaluation_prompt'),  // Prompt used by Backend-2 AI
  email_template: text('email_template'),        // Template for shortlisting emails
  created_by: uuid('created_by').references(() => admin.admin_id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
});
