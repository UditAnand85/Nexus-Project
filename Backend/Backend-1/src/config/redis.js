import { env } from './env.js';

/**
 * BullMQ Redis connection configuration.
 * Used by Queue and Worker instances throughout the app.
 *
 * `maxRetriesPerRequest: null` is REQUIRED for BullMQ to work correctly.
 * Without it, ioredis will throw errors on blocked operations.
 */
export const redisConnection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableReadyCheck: false,
};
