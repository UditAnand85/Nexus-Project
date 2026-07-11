/**
 * Database Seed Script
 * ====================
 * Populates the database with initial required data:
 *   1. Four default roles (Super Admin, HR Manager, Hiring Manager, Viewer)
 *   2. A default Super Admin account
 *
 * Run with: npm run db:seed
 *
 * NOTE: Uses onConflictDoNothing() — safe to run multiple times.
 */

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from '../config/db.js';
import { roles, admin } from './schema/index.js';
import { env } from '../config/env.js';

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
    role_name: 'HR Manager',
    description: 'Can create, update, delete, and view job postings. Manages candidate shortlisting.',
    is_active: true,
  },
  {
    role_key: 'R003',
    role_name: 'Hiring Manager',
    description: 'Can create, update, delete, and view job postings. Reviews shortlisted candidates.',
    is_active: true,
  },
  {
    role_key: 'R004',
    role_name: 'Viewer',
    description: 'Read-only access to job postings and evaluation results. Cannot make any changes.',
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

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  try {
    console.log('\n🌱  Starting database seed...\n');
    await seedRoles();
    await seedSuperAdmin();
    console.log('\n🎉  Database seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌  Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

main();
