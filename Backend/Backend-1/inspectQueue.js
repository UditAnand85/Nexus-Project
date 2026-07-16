import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis('redis://localhost:6379');
const queue = new Queue('resumeProcessing', { connection });

async function check() {
  const waiting = await queue.getWaiting();
  const active = await queue.getActive();
  const failed = await queue.getFailed();
  
  console.log(`Waiting: ${waiting.length}, Active: ${active.length}, Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('Sample failed job data:', failed[0].data);
    console.log('Sample failed job error:', failed[0].failedReason);
  }
  process.exit(0);
}
check();
