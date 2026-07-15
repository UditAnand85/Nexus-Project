import { db } from './src/config/db.js';
import { students, shortlistedStudents } from './src/db/schema/index.js';
import { eq } from 'drizzle-orm';

async function forceShortlist() {
  const emailToShortlist = 'uditanand0@gmail.com';
  
  // 1. Find the student
  const [student] = await db.select().from(students).where(eq(students.email, emailToShortlist)).limit(1);
  if (!student) {
    console.log('Student not found');
    process.exit(0);
  }
  
  console.log(`Found student ${student.email}. Current status: ${student.application_status}`);
  
  // 2. Update status to Shortlisted
  await db.update(students).set({ application_status: 'Shortlisted' }).where(eq(students.student_id, student.student_id));
  
  // 3. Insert into shortlisted_students if not exists
  const existing = await db.select().from(shortlistedStudents).where(eq(shortlistedStudents.student_id, student.student_id));
  if (existing.length === 0) {
    await db.insert(shortlistedStudents).values({
      student_id: student.student_id,
      current_stage: 'Video',
    });
    console.log('Inserted into shortlisted_students!');
  } else {
    console.log('Already in shortlisted_students.');
  }
  
  console.log('Done! You can now click Evaluate to send the email.');
  process.exit(0);
}

forceShortlist();
