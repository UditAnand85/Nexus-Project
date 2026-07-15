import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from './src/config/env.js';

async function run() {
  try {
    console.log('Testing S3 connection...');
    console.log('Region:', env.AWS_REGION);
    console.log('Bucket:', env.AWS_S3_BUCKET_NAME);
    console.log('Access Key ID:', env.AWS_ACCESS_KEY_ID ? 'Set' : 'Missing');
    console.log('Secret Key:', env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Missing');

    const s3Client = new S3Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET_NAME,
      Key: 'test-file.txt',
      Body: 'Hello world',
      ContentType: 'text/plain',
    });

    await s3Client.send(command);
    console.log('Upload successful!');
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

run();
