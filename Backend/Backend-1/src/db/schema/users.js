import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * USERS Table (Candidate Authentication)
 * Stores registered candidates who can log in to the platform and apply for jobs.
 * This is separate from the STUDENTS table, which stores per-job applications.
 *
 * When a user applies for a job, a new record is created in the STUDENTS table.
 */
export const users = pgTable('users', {
  user_id: serial('user_id').primaryKey(),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // bcrypt hashed
  phone: varchar('phone', { length: 20 }),
  // Password reset
  reset_token: varchar('reset_token', { length: 255 }),
  reset_token_expires_at: timestamp('reset_token_expires_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
});
