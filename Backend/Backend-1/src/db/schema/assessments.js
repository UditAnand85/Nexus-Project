import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { jobs } from './jobs.js';

/**
 * APTITUDE_QUESTIONS Table
 * Global aptitude question pool — not tied to a specific job.
 * Used for ALL candidates across all jobs.
 *
 * job_id is NULL for the global pool (seeded once via seedAptitude.js).
 * category: 'Spatial' | 'Quantitative' | 'Analytical'
 *
 * Test delivery: SELECT * FROM aptitude_questions WHERE job_id IS NULL ORDER BY RANDOM() LIMIT 20
 */
export const aptitudeQuestions = pgTable('aptitude_questions', {
  question_id: uuid('question_id').defaultRandom().primaryKey(),
  job_id: uuid('job_id').references(() => jobs.job_id), // nullable — NULL = global pool
  category: varchar('category', { length: 50 }).notNull().default('Quantitative'), // Spatial | Quantitative | Analytical
  question: text('question').notNull(),
  option_a: text('option_a').notNull(),
  option_b: text('option_b').notNull(),
  option_c: text('option_c').notNull(),
  option_d: text('option_d').notNull(),
  correct_answer: varchar('correct_answer', { length: 1 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

/**
 * TECHNICAL_QUESTIONS Table
 * AI-generated technical MCQs for a specific job.
 * Created automatically when a job is posted (Gemini API).
 * Deleted when the job is deleted.
 *
 * For technical jobs: 15 role-specific + 15 CS core (OOP, DBMS, CN, OS, DSA)
 * For non-technical jobs: 30 domain + reasoning MCQs
 *
 * Test delivery: SELECT * FROM technical_questions WHERE job_id = ? ORDER BY RANDOM() LIMIT 30
 */
export const technicalQuestions = pgTable('technical_questions', {
  question_id: uuid('question_id').defaultRandom().primaryKey(),
  job_id: uuid('job_id')
    .notNull()
    .references(() => jobs.job_id),
  category: varchar('category', { length: 100 }).notNull().default('Role-Specific'), // OOP | DBMS | CN | OS | DSA | Role-Specific | Domain
  question: text('question').notNull(),
  option_a: text('option_a').notNull(),
  option_b: text('option_b').notNull(),
  option_c: text('option_c').notNull(),
  option_d: text('option_d').notNull(),
  correct_answer: varchar('correct_answer', { length: 1 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
