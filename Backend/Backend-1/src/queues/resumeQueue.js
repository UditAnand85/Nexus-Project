import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

// ─── Queue Definition ─────────────────────────────────────────────────────────

export const RESUME_QUEUE_NAME = 'resume-processing';

/**
 * BullMQ Queue instance for resume processing.
 * Backend-1 adds jobs here → Backend-2 consumes and processes them.
 */
export const resumeQueue = new Queue(RESUME_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s, then 4s, then 8s
    },
    removeOnComplete: {
      count: 100,              // Keep last 100 completed jobs
      age: 24 * 60 * 60,      // Auto-remove after 24 hours
    },
    removeOnFail: {
      count: 50,               // Keep last 50 failed jobs for inspection
    },
  },
});

// ─── Producer ─────────────────────────────────────────────────────────────────

/**
 * Add a resume processing job to the BullMQ queue.
 * This is a fire-and-forget call — Backend-1 does NOT wait for the result.
 * Backend-2 will consume this job and POST results back to /api/v1/shortlisted/result.
 *
 * @param {Object} jobData
 * @param {number} jobData.studentId          - Student DB ID
 * @param {number} jobData.jobId              - Job posting ID
 * @param {string} jobData.fullName           - Candidate name
 * @param {string} jobData.email              - Candidate email
 * @param {string|null} jobData.phone         - Candidate phone
 * @param {string} jobData.resumeBase64       - Base64-encoded resume file
 * @param {string} jobData.resumeMimeType     - MIME type (application/pdf etc.)
 * @param {string} jobData.resumeOriginalName - Original filename
 * @param {string} jobData.evaluationPrompt   - Job's AI evaluation prompt
 * @param {number} jobData.resumeCutoffScore  - Minimum ATS score to shortlist
 *
 * @returns {Promise<import('bullmq').Job>} The BullMQ Job object
 */
export const addResumeJob = async (jobData) => {
  const job = await resumeQueue.add('process-resume', jobData);
  console.log(
    `[Queue] ✅ Resume job added | BullMQ ID: ${job.id} | Student ID: ${jobData.studentId} | Job ID: ${jobData.jobId}`
  );
  return job;
};
