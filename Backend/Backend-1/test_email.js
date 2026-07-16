import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from './src/config/ses.js';
import { env } from './src/config/env.js';

const testEmail = async () => {
  const emailCommand = new SendEmailCommand({
    Source: env.AWS_SES_FROM_EMAIL,
    Destination: { ToAddresses: [env.AWS_SES_FROM_EMAIL] }, // Send to self to test
    Message: {
      Subject: { Data: 'Test Email from RecruitAI', Charset: 'UTF-8' },
      Body: { Text: { Data: 'This is a test email.', Charset: 'UTF-8' } },
    },
  });

  try {
    console.log(`Sending email from ${env.AWS_SES_FROM_EMAIL}...`);
    await sesClient.send(emailCommand);
    console.log('✅ Email sent successfully!');
  } catch (err) {
    console.error('❌ Failed to send email:', err);
  }
};

testEmail();
