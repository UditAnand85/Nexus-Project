import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { env } from './src/config/env.js';

const student_id = '8e0a59ea-0a82-4bea-8c14-d94034e80b9a';
const job_id = 'c49684ee-809e-4820-bd9b-7b8c780328a8';

const token = jwt.sign(
  { student_id, job_id },
  env.JWT_SECRET,
  { expiresIn: env.JWT_EXPIRES_IN }
);

const link = `${env.CLIENT_URL}/evaluate?token=${token}`;

console.log('\n--- EVALUATION LINK ---');
console.log(link);
console.log('-----------------------\n');
