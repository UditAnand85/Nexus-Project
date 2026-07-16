import { db } from './src/config/db.js';
import { jobs } from './src/db/schema/index.js';
import { readFileSync } from 'fs';

const allJobs = await db.select().from(jobs).limit(1);
if (allJobs.length === 0) {
  console.log('No jobs found.');
  process.exit(1);
}
const jobId = allJobs[0].job_id;
console.log(`Testing apply with job: ${allJobs[0].job_title} (${jobId})`);

const pdfBuffer = readFileSync('./dummy.pdf');
const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

const formData = new FormData();
formData.append('full_name', 'Test Candidate');
formData.append('email', `test_${Date.now()}@example.com`); // unique so no duplicate check
formData.append('phone', '+91 9999999999');
formData.append('resume', blob, 'dummy.pdf');

console.log('POSTing to Backend-1...');
try {
  const res = await fetch(`http://127.0.0.1:5000/api/v1/students/apply/${jobId}`, {
    method: 'POST',
    body: formData,
  });
  const status = res.status;
  const data = await res.json();
  console.log('Status:', status);
  console.log('Response:', JSON.stringify(data, null, 2));
} catch (err) {
  console.error('Error:', err.message);
}
process.exit(0);
