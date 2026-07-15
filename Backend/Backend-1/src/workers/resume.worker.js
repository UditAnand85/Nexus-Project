import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { env } from '../config/env.js';
import { processResult } from '../services/shortlisted.service.js';

/**
 * Worker that listens to the 'resumeProcessing' queue.
 * It takes the candidate's resume, sends it to Backend-2 (AI Service),
 * and updates the database with the resulting score.
 */
const worker = new Worker(
  'resumeProcessing',
  async (job) => {
    const {
      student_id,
      base64Resume,
      mimeType,
      originalName,
      formDataParams,
    } = job.data;

    console.log(`[Worker] Processing resume for student: ${student_id}`);

    try {
      // 1. Reconstruct Resume Blob from base64
      const resumeBuffer = Buffer.from(base64Resume, 'base64');
      const resumeBlob = new Blob([resumeBuffer], { type: mimeType });

      // 2. Construct FormData for Backend-2
      const formData = new FormData();
      formData.append('name', formDataParams.full_name);
      formData.append('email', formDataParams.email);
      if (formDataParams.phone) formData.append('phone', formDataParams.phone);
      formData.append('job_id', formDataParams.jobId.toString());
      formData.append('evaluation_prompt', formDataParams.evaluation_prompt || '');
      formData.append('resume_cutoff_score', (formDataParams.resume_cutoff_score || 0).toString());
      formData.append('job_title', formDataParams.job_title || '');
      formData.append('job_description', formDataParams.job_description || '');
      
      formData.append('resume', resumeBlob, originalName);

      const backend2Url = env.BACKEND2_URL || 'http://127.0.0.1:5001';
      console.log(`[Worker] Sending resume to Backend-2 at ${backend2Url}/api/v1/resume/parse`);

      // 3. Make HTTP request to Backend-2
      const response = await fetch(`${backend2Url}/api/v1/resume/parse`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      let parsed_resume_json = null;
      let resume_score = 0;

      if (data.success && data.data) {
        parsed_resume_json = data.data.parsed_resume_json;
        resume_score = data.data.resume_score;
        console.log(`[Worker] Successfully parsed resume. Score: ${resume_score}`);
      } else {
        console.error('[Worker] Backend-2 returned error:', data.message);
        throw new Error(`Backend-2 Error: ${data.message}`);
      }

      // 4. Process the result (updates status and adds to shortlisted table)
      await processResult({
        student_id,
        parsed_resume_json,
        resume_score
      });

      console.log(`[Worker] Processed result for student: ${student_id}`);
      return { success: true, student_id, resume_score };

    } catch (error) {
      console.error(`[Worker] Job failed for student ${student_id}:`, error.message);
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: redisConnection,
  }
);

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed with error:`, err.message);
});

console.log('[Worker] resumeProcessing worker initialized');
