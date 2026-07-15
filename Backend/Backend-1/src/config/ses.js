import { SESClient } from '@aws-sdk/client-ses';
import { env } from './env.js';

/**
 * AWS SES Client for sending transactional emails.
 * Reuses the same region + credentials as the S3 client.
 */
export const sesClient = new SESClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});
