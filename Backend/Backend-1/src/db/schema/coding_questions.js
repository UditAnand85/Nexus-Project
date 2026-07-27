import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { jobs } from './jobs.js';

/**
 * CODING_QUESTIONS Table
 * LLaMA-generated coding problems for jobs that have coding_round_enabled=true.
 * Each job gets exactly 3 problems (Easy / Medium / Hard).
 *
 * Scoring: candidate's submitted stdout is compared against test_output.
 *   coding_score = (passed_tests / 3) × 100
 *
 * NOTE: test_input + test_output are NEVER sent to the client. Only
 *       title, description, sample_input, sample_output are exposed.
 *
 * Created fire-and-forget from createJob() — same pattern as technical_questions.
 * Deleted along with the job in deleteJobQuestions().
 */
export const codingQuestions = pgTable('coding_questions', {
  question_id: uuid('question_id').defaultRandom().primaryKey(),
  job_id: uuid('job_id')
    .notNull()
    .references(() => jobs.job_id),

  title: varchar('title', { length: 255 }).notNull(),

  // Full problem statement shown to candidate (markdown-friendly)
  description: text('description').notNull(),

  // Sample I/O shown to candidate for understanding
  sample_input: text('sample_input').notNull(),
  sample_output: text('sample_output').notNull(),

  // Hidden test case used for scoring — NEVER sent to client
  test_input: text('test_input').notNull(),
  test_output: text('test_output').notNull(), // expected stdout (trimmed)

  difficulty: varchar('difficulty', { length: 20 }).notNull().default('Medium'), // Easy | Medium | Hard
  language_hint: varchar('language_hint', { length: 100 }).default('Python, JavaScript, Java, C++'),

  created_at: timestamp('created_at').defaultNow().notNull(),
});
