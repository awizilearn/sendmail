
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, Settings, Loader2, MailCheck, Save, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardDescription, CardTitle } from '@/components/ui/card';
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
import { checkEmailSent, logSentEmail, sendConfiguredEmail, sendTestEmail } from '@/app/actions';
import { Checkbox } from '../ui/checkbox';
import type { MailRecipient } from '@/app/page';
import { useUser } from '@/firebase';
import { Progress } from '../ui/progress';

const smtpSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1, 'Port is required'),
  user: z.string().min(1, 'Username is required').email('Invalid email address'),
  pass: z.string(),
  savePassword: z.boolean().default(false),
});

const placeholderRegex = /\{\{([^}]+)\}\}/g;

type SmtpSettingsProps = {
  recipients: MailRecipient[];
  recipientCount: number;
  emailSubject: string;
  emailBody: string;
};

export default function SmtpSettings({ recipients, recipientCount, emailSubject, emailBody }: SmtpSettingsProps) {
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [sendingProgress, setSendingProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<z.infer<typeof smtpSchema>>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      host: '',
      port: 587,
      user: '',
      pass: '',
      savePassword: false,
    },
  });

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('smtpSettings');
      if (savedSettings) {
        const { host, port, user, pass, savePassword } = JSON.parse(savedSettings);
        form.reset({ 
          host, 
          port, 
          user, 
          pass: savePassword ? pass : '', 
          savePassword 
        });
      }
    } catch (error) {
      console.error("Failed to load SMTP settings from localStorage", error);
    }
  }, [form]);
  
  const handleSaveSettings = (values: z.infer<typeof smtpSchema>) => {
    try {
      const settingsToSave = {
        host: values.host,
        port: values.port,
        user: values.user,
        pass: values.savePassword ? values.pass : '',
        savePassword: values.savePassword,
      };
      localStorage.setItem('smtpSettings', JSON.stringify(settingsToSave));
      toast({
        title: 'Paramètres sauvegardés',
        description: 'Vos paramètres SMTP ont été sauvegardés localement.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Échec de la sauvegarde',
        description: 'Impossible de sauvegarder les paramètres SMTP dans le stockage local.',
      });
    }
  };

  const handleSendTestEmail = async (values: z.infer<typeof smtpSchema>) => {
    setIsTesting(true);
    toast({
      title: 'Test de la connexion...',
      description: "Tentative d'envoi d'un e-mail de test.",
    });

    const result = await sendTestEmail(values);

    if (result.success) {
      toast({
        title: 'Connexion vérifiée',
        description: result.message,
        className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Échec de la connexion',
        description: result.message,
      });
    }

    setIsTesting(false);
  };

  const replacePlaceholders = (text: string, data: MailRecipient) => {
    const formateurGender = data['Civilité Formateur'] === 'Mme' ? 'formatrice' : 'formateur';
    let processedText = text.replace(/\{\{formateur\/formatrice\}\}/g, formateurGender);
    
    return processedText.replace(placeholderRegex, (match, key) => {
      const trimmedKey = key.trim();
      return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : match;
    });
  };

  const handleSendEmails = async (values: z.infer<typeof smtpSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Utilisateur non authentifié' });
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

        const recipientId = String(recipient.id);
        const appointmentDate = String(recipient['Date du RDV']);

        const { sent } = await checkEmailSent(user.uid, recipientId, appointmentDate);

        if (sent) {
            setSkippedCount(prev => prev + 1);
        } else {
            const personalizedSubject = replacePlaceholders(emailSubject, recipient);
            const personalizedBody = replacePlaceholders(emailBody, recipient).replace(/\n/g, '<br />');

            const result = await sendConfiguredEmail(values, recipientEmail, personalizedSubject, personalizedBody);
            
            if (result.success) {
                await logSentEmail(user.uid, recipientId, appointmentDate);
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
        description: `Envoyés: ${sentCount}, Ignorés: ${skippedCount}, Échoués: ${failedCount}`,
        duration: 5000,
    });
  };

  return (
    <div>
      <CardTitle className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-lg flex items-center justify-center"><Send className="w-6 h-6"/></div>
          4. Configurer & Envoyer
      </CardTitle>
      <CardDescription className="mt-2 pl-12">
        Configurez votre client SMTP pour envoyer les emails. Les identifiants peuvent être sauvegardés localement.
      </CardDescription>
      <Form {...form}>
        <form className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="host" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hôte SMTP</FormLabel>
                  <FormControl><Input placeholder="smtp.example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="port" render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl><Input type="number" placeholder="587" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="user" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl><Input type="email" placeholder="your@email.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="pass" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center space-x-2">
            <FormField
              control={form.control}
              name="savePassword"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Sauvegarder le mot de passe (stocké localement, non chiffré)
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>

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

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
                type="button" 
                variant="secondary"
                onClick={form.handleSubmit(handleSaveSettings)} 
                disabled={isTesting || isSending}
                className="w-full sm:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </Button>
            <Button 
                type="button" 
                variant="outline"
                onClick={form.handleSubmit(handleSendTestEmail)} 
                disabled={isTesting || isSending}
                className="w-full sm:w-auto"
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MailCheck className="mr-2 h-4 w-4" />
              )}
              Email de test
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" className="w-full flex-1" disabled={isSending || isTesting || recipientCount === 0 || !form.formState.isValid || !form.getValues('pass')}>
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
                    Vous êtes sur le point d'envoyer des e-mails aux {recipientCount} destinataires. Le système vérifiera les doublons et n'enverra qu'aux personnes n'ayant pas déjà reçu cet e-mail.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={form.handleSubmit(handleSendEmails)} disabled={isSending}>
                    {isSending ? 'Envoi en cours...' : 'Procéder'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {!form.getValues('pass') && (
            <div className="flex items-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>Le mot de passe est requis pour envoyer des e-mails.</span>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
