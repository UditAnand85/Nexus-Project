import jwt from 'jsonwebtoken';
import { env } from './src/config/env.js';
import { db } from './src/config/db.js';
import { students } from './src/db/schema/index.js';

async function generate() {
  const [student] = await db.select().from(students).limit(1);
  const token = jwt.sign(
    { student_id: student.student_id, job_id: student.job_id },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  console.log(`http://localhost:5173/evaluate?token=${token}`);
  process.exit(0);
}
generate();
