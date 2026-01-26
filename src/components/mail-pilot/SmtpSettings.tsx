
"use client";

import { useState, useEffect } from 'react';
import { Send, Settings, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, addDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Switch } from '@/components/ui/switch';
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
import { sendConfiguredEmail, sendTestEmail } from '@/app/actions';
import type { MailRecipient } from '@/types/mail-recipient';
import { Progress } from '../ui/progress';
import { replacePlaceholders } from '@/lib/placeholder-replacer';
import type { DeliveryLog } from '@/types/delivery-log';
import type { SmtpConfig } from '@/types/smtp-config';
import { cn } from "@/lib/utils";


const smtpSchema = z.object({
  host: z.string().min(1, "L'hôte est requis"),
  port: z.coerce.number().min(1, 'Le port est requis'),
  user: z.string().min(1, "Le nom d'utilisateur est requis").email('Adresse e-mail invalide'),
  pass: z.string(),
  secure: z.boolean().default(true),
  savePassword: z.boolean().default(false),
});

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

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const settingsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'smtp-settings', user.uid);
  }, [user, firestore]);

  const { data: smtpConfig, isLoading: isLoadingConfig } = useDoc<SmtpConfig>(settingsDocRef);

  const form = useForm<z.infer<typeof smtpSchema>>({
      resolver: zodResolver(smtpSchema),
      defaultValues: { host: '', port: 587, user: '', pass: '', secure: true, savePassword: false },
  });
  
  useEffect(() => {
      if (smtpConfig) {
          form.reset(smtpConfig);
      }
  }, [smtpConfig, form]);

  useEffect(() => {
    if (!isLoadingConfig && !smtpConfig) {
      setIsConfigOpen(true);
    }
  }, [isLoadingConfig, smtpConfig]);

  const formValues = form.watch();
  const isFormReady = !!(formValues.host && formValues.port && formValues.user);

  const handleSaveConfiguration = async (values: z.infer<typeof smtpSchema>) => {
      if (!settingsDocRef) return;
      setIsSaving(true);
      try {
          const settingsToSave: SmtpConfig = {
              ...values,
              pass: values.savePassword ? values.pass : '',
          };
          await setDoc(settingsDocRef, settingsToSave, { merge: true });
          toast({
              title: 'Configuration Enregistrée',
              description: 'Vos paramètres de connexion ont été sauvegardés.',
          });
          setIsConfigOpen(false);
      } catch (error) {
          console.error("Failed to save SMTP settings to Firestore", error);
          toast({
              variant: 'destructive',
              title: 'Erreur de Sauvegarde',
              description: 'Impossible de sauvegarder la configuration.',
          });
      }
      setIsSaving(false);
  };
  
  const handleTestConnection = async (values: z.infer<typeof smtpSchema>) => {
      setIsTesting(true);
      toast({ title: 'Test de la connexion...', description: 'Envoi d\'un e-mail de test en cours.' });
      
      const result = await sendTestEmail(values);

      if (result.success) {
          toast({
              title: 'Connexion Réussie',
              description: result.message,
              className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600',
          });
      } else {
          toast({
              variant: 'destructive',
              title: 'Échec de la Connexion',
              description: result.message,
          });
      }
      setIsTesting(false);
  };


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
            Étape 4 sur 4 : Configurez votre serveur SMTP et envoyez l'e-mail composé aux destinataires sélectionnés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              {isConfigOpen ? "Masquer la configuration SMTP" : "Afficher la configuration SMTP"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSaveConfiguration)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <FormField control={form.control} name="host" render={({ field }) => (
                          <FormItem className="md:col-span-1">
                              <FormLabel>Hôte SMTP</FormLabel>
                              <FormControl><Input placeholder="smtp.example.com" {...field} /></FormControl>
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="port" render={({ field }) => (
                          <FormItem className="md:col-span-1">
                              <FormLabel>Port</FormLabel>
                              <FormControl><Input type="number" placeholder="587" {...field} /></FormControl>
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="user" render={({ field }) => (
                          <FormItem className="md:col-span-1">
                              <FormLabel>Nom d'utilisateur</FormLabel>
                              <FormControl><Input type="email" placeholder="user@company.com" {...field} /></FormControl>
                          </FormItem>
                      )} />
                      <FormField control={form.control} name="pass" render={({ field }) => (
                          <FormItem className="md:col-span-1">
                              <FormLabel>Mot de passe</FormLabel>
                              <div className="relative">
                                  <FormControl><Input type={passwordVisible ? 'text' : 'password'} placeholder="••••••••" {...field} /></FormControl>
                                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" onClick={() => setPasswordVisible(!passwordVisible)}>
                                      {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                              </div>
                          </FormItem>
                      )} />
                  </div>
                  <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="secure"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel>Chiffrement SSL/TLS</FormLabel>
                                <FormDescription>
                                    Sécurisez votre connexion avec le chiffrement SSL/TLS
                                </FormDescription>
                            </div>
                            <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="savePassword"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Sauvegarder le mot de passe</FormLabel>
                            <FormDescription>
                              Stockez votre mot de passe de manière sécurisée pour ne pas avoir à le ressaisir.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-4 border-t pt-6">
                        <div className={cn("flex items-center gap-2 text-sm", isFormReady ? "text-green-600" : "text-muted-foreground")}>
                          {isFormReady && <CheckCircle2 className="h-4 w-4" />}
                          <span>{isFormReady ? "Prêt à tester la connexion" : "Veuillez remplir les champs requis"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" onClick={form.handleSubmit(handleTestConnection)} disabled={!isFormReady || isTesting}>
                              {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {isTesting ? "Test en cours..." : "Tester la connexion"}
                          </Button>
                          <Button type="submit" disabled={!isFormReady || isSaving}>
                              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {isSaving ? "Enregistrement..." : "Sauvegarder"}
                          </Button>
                      </div>
                  </div>
              </form>
            </Form>
          </CollapsibleContent>
        </Collapsible>
        
        <div className="border-t pt-6 space-y-4">
          {isLoadingConfig ? (
              <div className="flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
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
                  {!smtpConfig?.pass && !isLoadingConfig && (
                      <div className="flex items-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          <span>Le mot de passe est requis. Veuillez le configurer et le sauvegarder ci-dessus.</span>
                      </div>
                  )}
                  {(!smtpConfig || !smtpConfig.host) && !isLoadingConfig && (
                    <div className="flex items-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>La configuration SMTP est manquante. Veuillez la configurer ci-dessus.</span>
                    </div>
                  )}
              </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
