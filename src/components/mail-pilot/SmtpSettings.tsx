
"use client";

import { useState, useEffect } from 'react';
import { Send, Settings, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { doc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { sendConfiguredEmail } from '@/app/actions';
import type { MailRecipient } from '@/types/mail-recipient';
import { Progress } from '../ui/progress';
import { replacePlaceholders } from '@/lib/placeholder-replacer';
import type { DeliveryLog } from '@/types/delivery-log';
import type { SmtpConfig } from '@/types/smtp-config';

type SmtpSettingsProps = {
  recipients: MailRecipient[];
  emailSubject: string;
  emailBody: string;
};

export default function SmtpSettings({ recipients, emailSubject, emailBody }: SmtpSettingsProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const recipientCount = recipients.length;

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'smtp-settings', user.uid);
  }, [user, firestore]);

  const { data: smtpConfig, isLoading: isLoadingConfig } = useDoc<SmtpConfig>(settingsDocRef);

  const handleSendEmails = async () => {
    if (!smtpConfig || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Configuration ou utilisateur manquant',
        description: 'Veuillez configurer vos paramètres SMTP et vous assurer que vous êtes connecté.',
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setSentCount(0);
    setSkippedCount(0);
    setFailedCount(0);

    const deliveryLogsRef = collection(firestore, 'delivery-logs');

    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const recipientEmail = String(recipient['adresse mail']);
        if (!recipientEmail) {
            setSkippedCount(prev => prev + 1);
            setSendingProgress(((i + 1) / recipients.length) * 100);
            continue;
        }

        const emailKey = `${recipientEmail}_${String(recipient['Date du RDV'])}`;

        // Check if this email was already sent
        const q = query(deliveryLogsRef, where('ownerId', '==', user.uid), where('emailKey', '==', emailKey));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            setSkippedCount(prev => prev + 1);
        } else {
            const personalizedSubject = replacePlaceholders(emailSubject, recipient);
            const personalizedBody = replacePlaceholders(emailBody, recipient).replace(/\n/g, '<br />');

            const result = await sendConfiguredEmail(smtpConfig, recipientEmail, personalizedSubject, personalizedBody);
            
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

    toast({
        title: "Envoi d'e-mails terminé",
        description: `Envoyés: ${sentCount}, Ignorés (déjà envoyés): ${skippedCount}, Échoués: ${failedCount}`,
        duration: 5000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Envoyer les e-mails</CardTitle>
        <CardDescription>
            Étape 4 sur 4 : Envoyez l'e-mail composé aux destinataires sélectionnés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingConfig ? (
            <div className="flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : !smtpConfig || !smtpConfig.host || !smtpConfig.user ? (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-accent/30 rounded-lg">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2"/>
                <h3 className="font-semibold">Configuration Requise</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Vos paramètres d'envoi d'e-mails ne sont pas configurés.
                </p>
                <Link href="/settings">
                    <Button>
                        <Settings className="mr-2 h-4 w-4"/>
                        Configurer les paramètres
                    </Button>
                </Link>
            </div>
        ) : (
            <>
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
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button className="w-full" disabled={isSending || recipientCount === 0 || !smtpConfig?.pass}>
                        {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <Send className="mr-2 h-4 w-4" />
                        )}
                        Envoyer à {recipientCount > 0 ? recipientCount : ''} Destinataires
                    </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer l'envoi des e-mails</AlertDialogTitle>
                        <AlertDialogDescription>
                        Vous êtes sur le point d'envoyer des e-mails aux {recipientCount} destinataires sélectionnés. Le système ignorera ceux qui ont déjà reçu un e-mail pour ce rendez-vous.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSendEmails} disabled={isSending}>
                        {isSending ? 'Envoi en cours...' : 'Procéder'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                {!smtpConfig?.pass && (
                    <div className="flex items-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>Le mot de passe est requis. Veuillez le saisir dans la <Link href="/settings" className="underline font-semibold">page de configuration</Link>.</span>
                    </div>
                )}
            </>
        )}
      </CardContent>
    </Card>
  );
}
