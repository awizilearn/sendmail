
'use client';

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Zap, SlidersHorizontal, Eye, EyeOff, CheckCircle2, Info, Loader2 } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { SmtpConfig } from '@/types/smtp-config';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from "@/lib/utils";
import { sendTestEmail } from '@/app/actions';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";

const GoogleIcon = (props: React.ComponentProps<'svg'>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.536,44,29.891,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

const MicrosoftIcon = (props: React.ComponentProps<'svg'>) => (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M10.0156 1.0125H1.0125V10.0156H10.0156V1.0125Z" fill="#F25022"/>
        <path d="M20.0125 1.0125H11.0094V10.0156H20.0125V1.0125Z" fill="#7FBA00"/>
        <path d="M10.0156 11.0094H1.0125V20.0125H10.0156V11.0094Z" fill="#00A4EF"/>
        <path d="M20.0125 11.0094H11.0094V20.0125H20.0125V11.0094Z" fill="#FFB900"/>
    </svg>
);

const smtpSchema = z.object({
  host: z.string().min(1, "L'hôte est requis"),
  port: z.coerce.number().min(1, 'Le port est requis'),
  user: z.string().min(1, "Le nom d'utilisateur est requis").email('Adresse e-mail invalide'),
  pass: z.string(),
  secure: z.boolean().default(true),
  savePassword: z.boolean().default(false),
});

export default function SettingsPage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const settingsDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'smtp-settings', user.uid);
    }, [user, firestore]);

    const { data: smtpSettings, isLoading: isLoadingSettings } = useDoc<SmtpConfig>(settingsDocRef);

    const form = useForm<z.infer<typeof smtpSchema>>({
        resolver: zodResolver(smtpSchema),
        defaultValues: { host: '', port: 587, user: '', pass: '', secure: true, savePassword: false },
    });
    
    useEffect(() => {
        if (smtpSettings) {
            form.reset(smtpSettings);
        }
    }, [smtpSettings, form]);

    const formValues = form.watch();
    const isReady = !!(formValues.host && formValues.port && formValues.user);

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

    return (
        <DashboardLayout>
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres de connexion e-mail</h1>
                <p className="text-muted-foreground">Configurez votre fournisseur de messagerie pour automatiser les notifications de rendez-vous à partir de vos données Excel.</p>
            </header>

            <div className="space-y-8 max-w-4xl">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 text-primary" />
                            <CardTitle>Connexion directe</CardTitle>
                        </div>
                        <CardDescription>Connectez-vous rapidement et en toute sécurité via OAuth 2.0. Aucun stockage de mot de passe requis pour une sécurité maximale.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Button variant="outline" className="bg-white">
                            <MicrosoftIcon className="mr-2"/>
                            Se connecter avec Microsoft
                        </Button>
                        <Button variant="outline" className="bg-white">
                            <GoogleIcon className="mr-2"/>
                            Se connecter avec Google
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <SlidersHorizontal className="h-5 w-5 text-primary" />
                            <CardTitle>Configuration SMTP manuelle</CardTitle>
                        </div>
                        <CardDescription>Pour les serveurs de messagerie personnalisés ou d'entreprise qui ne prennent pas en charge la connexion directe OAuth.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingSettings ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                                    <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                                </div>
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : (
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
                                     <div className={cn("flex items-center gap-2 text-sm", isReady ? "text-green-600" : "text-muted-foreground")}>
                                        {isReady && <CheckCircle2 className="h-4 w-4" />}
                                        <span>{isReady ? "Prêt à tester la connexion" : "Veuillez remplir les champs requis"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="outline" onClick={form.handleSubmit(handleTestConnection)} disabled={!isReady || isTesting}>
                                            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isTesting ? "Test en cours..." : "Tester la connexion"}
                                        </Button>
                                        <Button type="submit" disabled={!isReady || isSaving}>
                                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isSaving ? "Enregistrement..." : "Sauvegarder la configuration"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                           </Form>
                        )}
                    </CardContent>
                </Card>

                <Alert>
                    <Info className="h-4 w-4"/>
                    <AlertTitle>Lequel choisir ?</AlertTitle>
                    <AlertDescription>
                    La plupart des utilisateurs devraient utiliser la connexion directe pour une meilleure sécurité et une configuration plus simple. Utilisez la configuration SMTP manuelle uniquement si vous utilisez un domaine personnalisé ou un serveur de messagerie privé.
                    </AlertDescription>
                </Alert>
            </div>
        </DashboardLayout>
    );
}
