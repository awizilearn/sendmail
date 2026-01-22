
'use server';

import { generateConfirmationMessage, type ConfirmationMessageInput } from '@/ai/flows/confirmation-message-generation';
import { initializeServerFirebase } from '@/firebase/server-init';
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
};

export async function sendTestEmail(smtpConfig: SmtpConfig): Promise<{ success: boolean; message: string }> {
  const { host, port, user, pass } = smtpConfig;

  if (!host || !port || !user || !pass) {
    return { success: false, message: 'La configuration SMTP est incomplète.' };
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
      subject: 'Mail Pilot - Test de Connexion',
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
      return { success: true, message: `E-mail envoyé à ${recipientEmail}` };
    } catch (error) {
      console.error(`Failed to send email to ${recipientEmail}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, message: `Échec de l'envoi à ${recipientEmail}: ${errorMessage}` };
    }
}

export async function logSentEmail(userId: string, recipientId: string, appointmentDate: string): Promise<{ success: boolean; message?: string }> {
    const { firestore } = initializeServerFirebase();
    try {
      const logDocRef = firestore.collection('users').doc(userId).collection('recipients').doc(recipientId).collection('emailLogs').doc();
      
      await logDocRef.set({
        id: logDocRef.id,
        appointmentDate,
        sentDateTime: new Date().toISOString(),
        status: 'sent',
        recipientId: recipientId,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to log email:', error);
      return { success: false, message: "Échec de l'enregistrement de l'e-mail dans Firestore." };
    }
}
  
export async function checkEmailSent(userId: string, recipientId: string, appointmentDate: string): Promise<{ sent: boolean; message?: string }> {
    const { firestore } = initializeServerFirebase();
    try {
      const logsCollection = firestore.collection('users').doc(userId).collection('recipients').doc(recipientId).collection('emailLogs');
      const q = logsCollection
        .where('appointmentDate', '==', appointmentDate)
        .where('recipientId', '==', recipientId);
      const querySnapshot = await q.get();
      return { sent: !querySnapshot.empty };
    } catch (error) {
      console.error('Failed to check email log:', error);
      return { sent: false, message: "Échec de la vérification de l'historique des e-mails dans Firestore." };
    }
}

export async function clearAllRecipients(userId: string): Promise<{ success: boolean; message?: string }> {
    const { firestore } = initializeServerFirebase();
    try {
        const recipientsRef = firestore.collection('users').doc(userId).collection('recipients');
        const querySnapshot = await recipientsRef.get();

        if (querySnapshot.empty) {
            return { success: true, message: 'Aucun destinataire à supprimer.' };
        }

        const batch = firestore.batch();
        querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error('Failed to clear recipients:', error);
        return { success: false, message: 'Échec de la suppression des destinataires dans Firestore.' };
    }
}
