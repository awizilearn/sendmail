'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, Loader2, AlertCircle, Settings } from 'lucide-react';
import { doc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sendConfiguredEmail } from '@/app/actions';
import type { MailRecipient } from '@/types/mail-recipient';
import { Progress } from '../ui/progress';
import { replacePlaceholders } from '@/lib/placeholder-replacer';
import type { DeliveryLog } from '@/types/delivery-log';
import type { SmtpConfig } from '@/types/smtp-config';
import { Checkbox } from '../ui/checkbox';

type EmailSenderProps = {
  recipients: MailRecipient[];
  emailSubject: string;
  emailBody: string;
};

export default function EmailSender({ recipients, emailSubject, emailBody }: EmailSenderProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [sessionPassword, setSessionPassword] = useState('');
  
  // State for confirmation flow
  const [isConfirming, setIsConfirming] = useState(false);
  const [sendCounts, setSendCounts] = useState({ new: 0, skipped: 0 });
  const [forceResend, setForceResend] = useState(false);

  const recipientCount = recipients.length;

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'smtp-settings', user.uid);
  }, [user, firestore]);

  const { data: smtpConfig, isLoading: isLoadingConfig } = useDoc<SmtpConfig>(settingsDocRef);

  const handleConfirmSend = async () => {
    if (!user || !firestore || recipientCount === 0) return;

    setForceResend(false); // Reset resend toggle

    const deliveryLogsRef = collection(firestore, 'delivery-logs');
    const logsQuery = query(deliveryLogsRef, where('ownerId', '==', user.uid));
    const existingLogsSnapshot = await getDocs(logsQuery);
    const existingEmailKeys = new Set(existingLogsSnapshot.docs.map(doc => doc.data().emailKey));

    let newRecipients = 0;
    let alreadySentRecipients = 0;

    for (const recipient of recipients) {
      const recipientEmail = String(recipient['adresse mail']);
      if (!recipientEmail) continue;

      const emailKey = `${recipientEmail}_${String(recipient['Date du RDV'])}`;
      if (existingEmailKeys.has(emailKey)) {
        alreadySentRecipients++;
      } else {
        newRecipients++;
      }
    }

    setSendCounts({ new: newRecipients, skipped: alreadySentRecipients });
    setIsConfirming(true);
  };


  const handleSendEmails = async () => {
    setIsConfirming(false); // Close confirmation dialog

    const currentConfig = smtpConfig;
    if (!currentConfig || !user || !firestore) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger la configuration.'});
        return;
    }

    const configForSending: SmtpConfig = {
      ...currentConfig,
      pass: currentConfig.pass || sessionPassword,
    };
    
    if (!configForSending.pass) {
        toast({
            variant: 'destructive',
            title: 'Mot de passe manquant',
            description: "Veuillez fournir le mot de passe SMTP pour continuer.",
        });
        setIsConfirming(true); // Re-open dialog to ask for password
        return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setSentCount(0);
    setSkippedCount(0);
    setFailedCount(0);

    const deliveryLogsRef = collection(firestore, 'delivery-logs');
    const logsQuery = query(deliveryLogsRef, where('ownerId', '==', user.uid));
    const existingLogsSnapshot = await getDocs(logsQuery);
    const existingEmailKeys = new Set(existingLogsSnapshot.docs.map(doc => doc.data().emailKey));

    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const recipientEmail = String(recipient['adresse mail']);
        if (!recipientEmail) {
            setSkippedCount(prev => prev + 1);
            setSendingProgress(((i + 1) / recipients.length) * 100);
            continue;
        }

        const emailKey = `${recipientEmail}_${String(recipient['Date du RDV'])}`;
        const alreadySent = existingEmailKeys.has(emailKey);

        if (alreadySent && !forceResend) {
            setSkippedCount(prev => prev + 1);
        } else {
            const personalizedSubject = replacePlaceholders(emailSubject, recipient);
            const personalizedBody = replacePlaceholders(emailBody, recipient).replace(/\n/g, '<br />');

            const result = await sendConfiguredEmail(configForSending, recipientEmail, personalizedSubject, personalizedBody);
            
            const logEntry: Omit<DeliveryLog, 'id'> = {
                ownerId: user.uid,
                emailKey: emailKey,
                beneficiary: {
                    name: String(recipient['Bénéficiare'] || ''),
                    email: recipientEmail,
                    initials: (String(recipient['Bénéficiare'] || '?')).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                },
                trainer: String(recipient['Formateur/Formatrice'] || ''),
                date: `${recipient['Date du RDV']} de ${recipient['Heure RDV']} à ${recipient['Fin RDV']}`,
                status: result.success ? 'Delivered' : 'Failed',
                sentAt: new Date().toISOString(),
            };
            
            await addDoc(deliveryLogsRef, logEntry);

            if (result.success) {
                setSentCount(prev => prev + 1);
            } else {
                setFailedCount(prev => prev + 1);
            }
        }
        setSendingProgress(((i + 1) / recipients.length) * 100);
    }
    
    setIsSending(false);
    setSessionPassword('');

    toast({
        title: "Envoi d'e-mails terminé",
        description: `Envoyés: ${sentCount}, Ignorés: ${skippedCount}, Échoués: ${failedCount}`,
        duration: 5000,
    });
  };

  const renderStatus = () => {
    if (isLoadingConfig) {
      return <div className="flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }
    if (!smtpConfig || !smtpConfig.host) {
      return (
        <div className="flex flex-col items-center text-center gap-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-4 mt-2">
            <AlertCircle className="h-8 w-8" />
            <span>La configuration SMTP est manquante. Veuillez la configurer avant de pouvoir envoyer des e-mails.</span>
            <Button asChild variant="outline" size="sm">
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" />Aller aux paramètres</Link>
            </Button>
        </div>
      );
    }
    return null;
  }

  const needsPasswordPrompt = smtpConfig && !smtpConfig.pass;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Envoyer les e-mails</CardTitle>
        <CardDescription>
            Envoyez l'e-mail composé aux destinataires sélectionnés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderStatus()}
        
        {isSending && (
          <div className="space-y-2">
            <Progress value={sendingProgress} />
            <div className="text-sm text-muted-foreground flex justify-between">
              <span>Envoyés: {sentCount}</span>
              <span>Ignorés: {skippedCount}</span>
              <span>Échoués: {failedCount}</span>
              <span>Total: {recipientCount}</span>
            </div>
          </div>
        )}

        <Button className="w-full" onClick={handleConfirmSend} disabled={isSending || isConfirming || recipientCount === 0 || !smtpConfig?.host}>
          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Envoyer à {recipientCount > 0 ? recipientCount : ''} Destinataires
        </Button>

        <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer l'envoi des e-mails</AlertDialogTitle>
              <AlertDialogDescription>
                Vous êtes sur le point d'envoyer des e-mails à {recipientCount} destinataires.
                <br/>- {sendCounts.new} nouveaux e-mails seront envoyés.
                {sendCounts.skipped > 0 && (
                  <span className="mt-2 block font-medium">
                    - {sendCounts.skipped} destinataires ont déjà reçu cet e-mail.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {sendCounts.skipped > 0 && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="force-resend"
                  checked={forceResend}
                  onCheckedChange={(checked) => setForceResend(Boolean(checked))}
                />
                <Label htmlFor="force-resend" className="cursor-pointer text-sm font-normal">
                  Confirmer pour renvoyer aux {sendCounts.skipped} destinataires.
                </Label>
              </div>
            )}

            {needsPasswordPrompt && (
              <div className="space-y-2 py-2">
                  <Label htmlFor="session-password">Mot de passe SMTP</Label>
                  <Input 
                      id="session-password" 
                      type="password"
                      placeholder="••••••••"
                      value={sessionPassword}
                      onChange={(e) => setSessionPassword(e.target.value)} 
                      autoComplete="current-password"
                  />
                  <p className="text-xs text-muted-foreground">
                      Votre mot de passe n'est pas sauvegardé. Il est uniquement utilisé pour cette session d'envoi.
                  </p>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSessionPassword('')}>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleSendEmails} disabled={isSending || (needsPasswordPrompt && !sessionPassword)}>
                {isSending ? 'Envoi en cours...' : 'Procéder'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
