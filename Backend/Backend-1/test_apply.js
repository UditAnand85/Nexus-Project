import test from 'node:test';

const formData = new FormData();
formData.append('full_name', 'Test User');
formData.append('email', 'test@example.com');
formData.append('phone', '1234567890');
// No resume file, just seeing if the endpoint exists.

// Fetch a real job ID from the DB
import { db } from './src/config/db.js';
import { jobs } from './src/db/schema/index.js';

async function run() {
  const allJobs = await db.select().from(jobs).limit(1);
  if (allJobs.length === 0) {
    console.log('No jobs found to test with.');
    process.exit(0);
  }
  const jobId = allJobs[0].job_id;

  console.log(`Sending POST to /api/v1/students/apply/${jobId}`);
  try {
    const response = await fetch(`http://localhost:5000/api/v1/students/apply/${jobId}`, {
      method: 'POST',
      body: formData
    });
    const status = response.status;
    let data;
    try { data = await response.json(); } catch(e) { data = await response.text(); }
    console.log('Response:', status, data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
  process.exit(0);
}

run();
