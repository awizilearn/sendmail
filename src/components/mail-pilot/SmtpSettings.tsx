
"use client";

import { useState, useEffect } from 'react';
import * as z from 'zod';
import { Send, Settings, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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

const smtpSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1, 'Port is required'),
  user: z.string().min(1, 'Username is required').email('Invalid email address'),
  pass: z.string(),
  secure: z.boolean().default(true),
});

type SmtpConfig = z.infer<typeof smtpSchema>;

type SmtpSettingsProps = {
  recipients: MailRecipient[];
  emailSubject: string;
  emailBody: string;
  sentEmailKeys: Set<string>;
  onEmailLogged: (key: string) => void;
};

export default function SmtpSettings({ recipients, emailSubject, emailBody, sentEmailKeys, onEmailLogged }: SmtpSettingsProps) {
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig | null>(null);
  const recipientCount = recipients.length;

  const { toast } = useToast();

  useEffect(() => {
    // Function to load settings, can be recalled
    const loadSettings = () => {
        try {
            const savedSettings = localStorage.getItem('smtpSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                const result = smtpSchema.safeParse(parsed);
                if (result.success) {
                    setSmtpConfig(result.data);
                } else {
                    setSmtpConfig(null);
                }
            } else {
                 setSmtpConfig(null);
            }
        } catch (error) {
            console.error("Failed to load SMTP settings from localStorage", error);
            setSmtpConfig(null);
        }
    };
    
    loadSettings();

    // Listen for storage changes from other tabs
    window.addEventListener('storage', loadSettings);
    
    // Also listen for a custom event when settings are saved on the same page
    window.addEventListener('smtp-settings-updated', loadSettings);

    return () => {
        window.removeEventListener('storage', loadSettings);
        window.removeEventListener('smtp-settings-updated', loadSettings);
    };
  }, []);

  const handleSendEmails = async () => {
    if (!smtpConfig) {
      toast({
        variant: 'destructive',
        title: 'Configuration SMTP manquante',
        description: 'Veuillez configurer vos paramètres SMTP avant d\'envoyer des e-mails.',
      });
      return;
    }

    setIsSending(true);
    setSendingProgress(0);
    setSentCount(0);
    setSkippedCount(0);
    setFailedCount(0);

    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const recipientEmail = String(recipient['adresse mail']);
        if (!recipientEmail) {
            setSkippedCount(prev => prev + 1);
            setSendingProgress(((i + 1) / recipients.length) * 100);
            continue;
        }

        const emailKey = `${recipientEmail}_${String(recipient['Date du RDV'])}`;

        if (sentEmailKeys.has(emailKey)) {
            setSkippedCount(prev => prev + 1);
        } else {
            const personalizedSubject = replacePlaceholders(emailSubject, recipient);
            const personalizedBody = replacePlaceholders(emailBody, recipient).replace(/\n/g, '<br />');

            const result = await sendConfiguredEmail(smtpConfig, recipientEmail, personalizedSubject, personalizedBody);
            
            if (result.success) {
                onEmailLogged(emailKey);
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
        {!smtpConfig || !smtpConfig.host || !smtpConfig.user ? (
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
