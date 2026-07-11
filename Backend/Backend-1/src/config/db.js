import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema/index.js';
import { env } from './env.js';

// ─── PostgreSQL Client (with connection pool) ─────────────────────────────────
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,               // max pool connections
  idle_timeout: 30,      // close idle connections after 30s
  connect_timeout: 10,   // fail fast if DB unreachable
  onnotice: () => {},    // suppress postgres NOTICE messages
});

// ─── Drizzle ORM Instance ─────────────────────────────────────────────────────
export const db = drizzle(queryClient, {
  schema,
  logger: env.NODE_ENV === 'development',
});
