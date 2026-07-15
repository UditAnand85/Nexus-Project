import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

/**
 * Queue to handle background processing of resumes via the AI microservice.
 */
export const resumeQueue = new Queue('resumeProcessing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

console.log('[Queue] resumeProcessing initialized');
