
'use server';

import { generateConfirmationMessage, type ConfirmationMessageInput } from '@/ai/flows/confirmation-message-generation';
import nodemailer from 'nodemailer';

export async function getAIGeneratedMessage(input: ConfirmationMessageInput): Promise<{success: boolean; message: string;}> {
    try {
        const result = await generateConfirmationMessage(input);
        return { success: true, message: result.confirmationMessage };
    } catch (error) {
        console.error('AI message generation failed:', error);
        return { success: false, message: "Échec de la génération du message par l'IA. Veuillez réessayer." };
    }
}

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
};

export async function sendTestEmail(smtpConfig: SmtpConfig): Promise<{ success: boolean; message: string }> {
  const { host, port, user, pass, secure } = smtpConfig;

  if (!host || !port || !user || !pass) {
    return { success: false, message: 'La configuration SMTP est incomplète. Le mot de passe est requis pour le test.' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
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
      subject: 'envoi mail J-4 - Test de Connexion',
      text: 'Votre connexion SMTP est configurée correctement.',
      html: '<b>Votre connexion SMTP est configurée correctement.</b>',
    });

    return { success: true, message: 'Connexion réussie. E-mail de test envoyé.' };
  } catch (error) {
    console.error('Failed to send test email:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Échec de la connexion: ${errorMessage}` };
  }
}

export async function sendConfiguredEmail(
    smtpConfig: SmtpConfig,
    recipientEmail: string,
    subject: string,
    body: string
  ): Promise<{ success: boolean; message: string }> {
    const { host, port, user, pass, secure } = smtpConfig;
  
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
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
      return { success: true, message: `E-mail envoyé à ${recipientEmail}` };
    } catch (error) {
      console.error(`Failed to send email to ${recipientEmail}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `Échec de l'envoi à ${recipientEmail}: ${errorMessage}` };
    }
}
