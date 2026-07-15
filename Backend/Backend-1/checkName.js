import { db } from './src/config/db.js';
import { students } from './src/db/schema/index.js';
import { eq } from 'drizzle-orm';

async function check() {
  const [student] = await db.select().from(students).where(eq(students.email, 'uditanand0@gmail.com')).limit(1);
  console.log(student);
  process.exit(0);
}
check();
