import { pgTable, varchar, text, boolean } from 'drizzle-orm/pg-core';

/**
 * ROLES Table
 * Stores all available roles for company employees.
 * Seeded with 4 default roles: Super Admin, HR Manager, Hiring Manager, Viewer.
 */
export const roles = pgTable('roles', {
  role_key: varchar('role_key', { length: 10 }).primaryKey(),  // e.g. R001
  role_name: varchar('role_name', { length: 100 }).notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
});
