import { db } from './src/config/db.js';
import { jobs } from './src/db/schema/index.js';
import { generateTechnicalQuestions } from './src/services/questions.service.js';

async function run() {
  const allJobs = await db.select().from(jobs).limit(1);
  if (allJobs.length === 0) {
    console.log('No jobs found.');
    process.exit(1);
  }
  const job = allJobs[0];
  console.log(`Generating questions for job: ${job.job_title} (${job.job_id})`);
  
  await generateTechnicalQuestions(job.job_id, job.job_title, job.job_description);
  console.log('Done!');
  process.exit(0);
}

run().catch(console.error);
