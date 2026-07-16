import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { jobs } from './jobs.js';

export const aptitudeQuestions = pgTable('aptitude_questions', {
  question_id: uuid('question_id').defaultRandom().primaryKey(),
  job_id: uuid('job_id')
    .notNull()
    .references(() => jobs.job_id),
  question: text('question').notNull(),
  option_a: text('option_a').notNull(),
  option_b: text('option_b').notNull(),
  option_c: text('option_c').notNull(),
  option_d: text('option_d').notNull(),
  correct_answer: varchar('correct_answer', { length: 1 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

