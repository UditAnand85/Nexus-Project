/**
 * Database Seed Script
 * ====================
 * Populates the database with initial required data:
 *   1. Three default roles (Super Admin, Recruiter, Employee)
 *   2. A default Super Admin account
 *
 * Run with: npm run db:seed
 *
 * NOTE: Uses onConflictDoNothing() — safe to run multiple times.
 *       Also runs a migration to reassign any legacy R004 (Viewer) accounts → R003 (Employee).
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from '../config/db.js';
import { roles, admin } from './schema/index.js';
import { env } from '../config/env.js';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 12;

// ─── Seed Data ────────────────────────────────────────────────────────────────

const ROLES_DATA = [
  {
    role_key: 'R001',
    role_name: 'Super Admin',
    description: 'Full system access with all administrative privileges. Can manage roles, admins, and all job postings.',
    is_active: true,
  },
  {
    role_key: 'R002',
    role_name: 'Recruiter',
    description: 'Can create, update, delete, and view job postings. Manages candidate shortlisting.',
    is_active: true,
  },
  {
    role_key: 'R003',
    role_name: 'Employee',
    description: 'View-only access to job postings and evaluation results. Cannot make any changes.',
    is_active: true,
  },
];

// ─── Seed Functions ───────────────────────────────────────────────────────────

const seedRoles = async () => {
  console.log('📋  Seeding roles...');
  for (const role of ROLES_DATA) {
    await db.insert(roles).values(role).onConflictDoNothing();
  }
  console.log('✅  Roles seeded successfully.');
};

const seedSuperAdmin = async () => {
  console.log('👤  Seeding Super Admin account...');

  const email = env.SEED_ADMIN_EMAIL;
  const password = env.SEED_ADMIN_PASSWORD;

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await db
    .insert(admin)
    .values({
      full_name: 'Super Admin',
      email,
      password: hashedPassword,
      role_key: 'R001',
      department: 'Administration',
      phone: null,
      account_status: 'Active',
    })
    .onConflictDoNothing(); // Do nothing if email already exists

  console.log(`✅  Super Admin seeded: ${email}`);
  console.log(`🔑  Default password: ${password}`);
  console.log(`⚠️   Please change the password after first login!`);
};

const seedEmployees = async () => {
  console.log('👥  Seeding Admin Employees...');
  const password = env.SEED_ADMIN_PASSWORD;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const employees = [
    {
      full_name: 'Jane Recruiter',
      email: 'jane.hr@recruitai.com',
      password: hashedPassword,
      role_key: 'R002', // Recruiter
      department: 'Human Resources',
      phone: '555-0201',
      account_status: 'Active',
    },
    {
      full_name: 'Mark Employee',
      email: 'mark.hiring@recruitai.com',
      password: hashedPassword,
      role_key: 'R003', // Employee
      department: 'Engineering',
      phone: '555-0202',
      account_status: 'Active',
    },
    {
      full_name: 'Udit Anand',
      email: 'uditanand0@gmail.com',
      password: hashedPassword,
      role_key: 'R001', // Super Admin
      department: 'Administration',
      phone: null,
      account_status: 'Active',
    }
  ];

  for (const emp of employees) {
    await db.insert(admin).values(emp).onConflictDoNothing();
    console.log(`✅  Admin Employee seeded: ${emp.email} (Role: ${emp.role_key})`);
  }
};

// ─── Migrate legacy R004 (Viewer) → R003 (Employee) ──────────────────────────

const migrateRoles = async () => {
  console.log('🔄  Migrating legacy roles...');

  // Reassign any existing R004 admins to R003 (Employee)
  const migrated = await db
    .update(admin)
    .set({ role_key: 'R003' })
    .where(eq(admin.role_key, 'R004'))
    .returning({ email: admin.email });

  if (migrated.length > 0) {
    console.log(`✅  Migrated ${migrated.length} admin(s) from R004 → R003:`);
    migrated.forEach((a) => console.log(`    - ${a.email}`));
  } else {
    console.log('✅  No R004 accounts to migrate.');
  }

  // Remove the legacy R004 role if it still exists
  await db.delete(roles).where(eq(roles.role_key, 'R004'));
  console.log('✅  Legacy R004 (Viewer) role removed (if it existed).');
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  try {
    console.log('\n🌱  Starting database seed...\n');
    await migrateRoles();   // Must run before seedRoles to avoid FK conflicts
    await seedRoles();
    await seedSuperAdmin();
    await seedEmployees();
    console.log('\n🎉  Database seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌  Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

main();
