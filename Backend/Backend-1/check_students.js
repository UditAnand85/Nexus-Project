import { db } from './src/config/db.js';
import { students } from './src/db/schema/index.js';

async function check() {
  const allStudents = await db.select({
    id: students.student_id,
    name: students.full_name,
    resume_url: students.resume_url,
    resume_score: students.resume_score,
  }).from(students);

  console.table(allStudents);
  process.exit(0);
}
check();
