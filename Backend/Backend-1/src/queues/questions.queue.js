import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

/**
 * Queue for background AI-powered question generation.
 * Triggered when a new job is created.
 * Worker: src/workers/questions.worker.js
 */
export const questionsQueue = new Queue('questionGeneration', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000, // 10s initial delay
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

console.log('[Queue] questionGeneration initialized');
