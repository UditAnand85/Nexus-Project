import { pgTable, serial, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { roles } from './roles.js';

/**
 * ENUM: account_status
 * Determines if an admin account is currently active or deactivated.
 */
export const accountStatusEnum = pgEnum('account_status', ['Active', 'Inactive']);

/**
 * ADMIN Table
 * Stores all company employees who can access the admin portal.
 * Admin accounts are pre-seeded — they do NOT self-register.
 * Roles determine their level of access (CRUD vs read-only).
 */
export const admin = pgTable('admin', {
  admin_id: serial('admin_id').primaryKey(),
  full_name: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // bcrypt hashed
  role_key: varchar('role_key', { length: 10 })
    .notNull()
    .references(() => roles.role_key),
  department: varchar('department', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  account_status: accountStatusEnum('account_status').default('Active').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
    .notNull(),
});
