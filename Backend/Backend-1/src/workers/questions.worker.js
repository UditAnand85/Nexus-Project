import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { generateTechnicalQuestions } from '../services/questions.service.js';

/**
 * Worker that listens to the 'questionGeneration' queue.
 * Triggered after a new job is created.
 * Calls the Gemini/Groq AI to generate 30 MCQs and stores them in the DB.
 */
const worker = new Worker(
  'questionGeneration',
  async (job) => {
    const { jobId, jobTitle, jobDescription } = job.data;

    console.log(`[QuestionsWorker] Generating questions for job: "${jobTitle}" (${jobId})`);

    await generateTechnicalQuestions(jobId, jobTitle, jobDescription);

    console.log(`[QuestionsWorker] ✅ Finished question generation for job ${jobId}`);
    return { success: true, jobId };
  },
  {
    connection: redisConnection,
  }
);

worker.on('failed', (job, err) => {
  console.error(
    `[QuestionsWorker] ❌ Job ${job?.id} failed for jobId=${job?.data?.jobId}:`,
    err.message
  );
});

worker.on('completed', (job) => {
  console.log(`[QuestionsWorker] Job ${job.id} completed for jobId=${job.data?.jobId}`);
});

console.log('[Worker] questionGeneration worker initialized');
