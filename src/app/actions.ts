'use server';

import { generateConfirmationMessage, type ConfirmationMessageInput } from '@/ai/flows/confirmation-message-generation';
import nodemailer from 'nodemailer';

export async function getAIGeneratedMessage(input: ConfirmationMessageInput): Promise<{success: boolean; message: string;}> {
    try {
        const result = await generateConfirmationMessage(input);
        return { success: true, message: result.confirmationMessage };
    } catch (error) {
        console.error('AI message generation failed:', error);
        return { success: false, message: 'Failed to generate message from AI. Please try again.' };
    }
}

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
};

export async function sendTestEmail(smtpConfig: SmtpConfig): Promise<{ success: boolean; message: string }> {
  const { host, port, user, pass } = smtpConfig;

  if (!host || !port || !user || !pass) {
    return { success: false, message: 'SMTP configuration is incomplete.' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Verify connection configuration
    await transporter.verify();

    // Send test email
    await transporter.sendMail({
      from: user,
      to: user, // Send to self
      subject: 'Mail Pilot - Test Connection',
      text: 'Your SMTP connection is configured correctly.',
      html: '<b>Your SMTP connection is configured correctly.</b>',
    });

    return { success: true, message: 'Connection successful. Test email sent.' };
  } catch (error) {
    console.error('Failed to send test email:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Connection failed: ${errorMessage}` };
  }
}
