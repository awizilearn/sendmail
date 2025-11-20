'use server';

import { generateConfirmationMessage, type ConfirmationMessageInput } from '@/ai/flows/confirmation-message-generation';
import { initializeFirebase } from '@/firebase';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
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

export async function sendConfiguredEmail(
    smtpConfig: SmtpConfig,
    recipientEmail: string,
    subject: string,
    body: string
  ): Promise<{ success: boolean; message: string }> {
    const { host, port, user, pass } = smtpConfig;
  
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  
    try {
      await transporter.sendMail({
        from: user,
        to: recipientEmail,
        subject,
        html: body,
      });
      return { success: true, message: `Email sent to ${recipientEmail}` };
    } catch (error) {
      console.error(`Failed to send email to ${recipientEmail}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `Failed to send to ${recipientEmail}: ${errorMessage}` };
    }
}

export async function logSentEmail(userId: string, recipientEmail: string, appointmentDate: string): Promise<{ success: boolean; message?: string }> {
    const { firestore } = initializeFirebase();
    try {
      const logRef = doc(collection(firestore, 'users', userId, 'emailLogs'));
      await setDoc(logRef, {
        recipientEmail,
        appointmentDate,
        sentDateTime: new Date().toISOString(),
        status: 'sent'
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to log email:', error);
      return { success: false, message: 'Failed to log email in Firestore.' };
    }
}
  
export async function checkEmailSent(userId: string, recipientEmail: string, appointmentDate: string): Promise<{ sent: boolean; message?: string }> {
    const { firestore } = initializeFirebase();
    try {
      const logsCollection = collection(firestore, 'users', userId, 'emailLogs');
      const q = query(
        logsCollection,
        where('recipientEmail', '==', recipientEmail),
        where('appointmentDate', '==', appointmentDate)
      );
      const querySnapshot = await getDocs(q);
      return { sent: !querySnapshot.empty };
    } catch (error) {
      console.error('Failed to check email log:', error);
      return { sent: false, message: 'Failed to check email log in Firestore.' };
    }
}
