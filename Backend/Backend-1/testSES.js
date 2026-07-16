import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from './src/config/ses.js';
import { env } from './src/config/env.js';

async function testSES() {
  console.log('Testing SES in region:', env.AWS_REGION);
  console.log('From Email:', env.AWS_SES_FROM_EMAIL);

  // Change this to the verified email you are trying to send TO
  const toEmail = "uditanand0@gmail.com"; 

  const params = {
    Source: env.AWS_SES_FROM_EMAIL,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: 'Test Email from RecruitAI' },
      Body: { Text: { Data: 'This is a test email to verify SES setup.' } },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log('✅ Email sent successfully! Message ID:', response.MessageId);
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error(error.message);
    if (error.name) console.error('Error Name:', error.name);
  }
}

testSES();
