import {
  pgTable,
  decimal,
  timestamp,
  varchar,
  uuid,
} from 'drizzle-orm/pg-core';
import { students } from './students.js';



/**
 * SHORTLISTED_STUDENTS Table
 * Created for candidates who passed the resume ATS cutoff score.
 * Tracks the multi-round evaluation journey: Aptitude → Final Review.
 *
 * Relationship: STUDENTS (1) → SHORTLISTED_STUDENTS (0..1)
 * A student has at most one shortlisted record.
 */
export const shortlistedStudents = pgTable('shortlisted_students', {
  shortlisted_id: uuid('shortlisted_id').defaultRandom().primaryKey(),
  student_id: uuid('student_id')
    .notNull()
    .references(() => students.student_id)
    .unique(), // One shortlisted record per student
  aptitude_score: decimal('aptitude_score', { precision: 5, scale: 2 }),
  final_score: decimal('final_score', { precision: 5, scale: 2 }),

  current_stage: varchar('current_stage', { length: 100 }), // Aptitude / Final Review / Completed
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
});
