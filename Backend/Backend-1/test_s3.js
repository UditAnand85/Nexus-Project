import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from './src/config/s3.js';
import { env } from './src/config/env.js';

async function testUpload() {
  const command = new PutObjectCommand({
    Bucket: 'recruit-ai-user',
    Key: 'test-upload.txt',
    Body: 'Hello world',
    ContentType: 'text/plain',
  });

  try {
    console.log(`Uploading to bucket: recruit-ai-user in region ap-south-1...`);
    await s3Client.send(command);
    console.log('✅ Upload successful!');
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

testUpload();
