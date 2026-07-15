import { db } from './src/config/db.js';
import { jobs } from './src/db/schema/index.js';
import { ilike } from 'drizzle-orm';

async function resetJob() {
  try {
    const updated = await db
      .update(jobs)
      .set({ job_status: 'Shortlisting Closed' })
      .where(ilike(jobs.job_title, '%frontend%'))
      .returning();
      
    if (updated.length > 0) {
      console.log('Successfully reset job(s):', updated.map(j => j.job_title).join(', '));
      console.log('You can now click the Evaluate button again!');
    } else {
      console.log('No job found with frontend in the title');
    }
  } catch (error) {
    console.error('Error resetting job:', error);
  } process.exit(0);
}

resetJob();
