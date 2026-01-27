
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { sendTestEmail } from '@/app/actions';
import type { SmtpConfig } from '@/types/smtp-config';

const smtpSchema = z.object({
  host: z.string().min(1, "L'hôte est requis"),
  port: z.coerce.number().min(1, 'Le port est requis'),
  user: z.string().min(1, "Le nom d'utilisateur est requis").email('Adresse e-mail invalide'),
  pass: z.string(),
  secure: z.boolean().default(true),
  savePassword: z.boolean().default(false),
});

export default function SettingsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const settingsDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'smtp-settings', user.uid);
    }, [user, firestore]);

    const { data: smtpConfig } = useDoc<SmtpConfig>(settingsDocRef);

    const form = useForm<z.infer<typeof smtpSchema>>({
        resolver: zodResolver(smtpSchema),
        defaultValues: { host: '', port: 587, user: '', pass: '', secure: true, savePassword: false },
    });
    
    useEffect(() => {
        if (smtpConfig) {
            form.reset(smtpConfig);
        }
    }, [smtpConfig, form]);

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
            <header className="flex items-center justify-between">
                <div>
                <p className="text-sm text-muted-foreground">Configuration</p>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres E-mail</h1>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Configuration SMTP</CardTitle>
                    <CardDescription>
                        Entrez les détails de votre serveur d'envoi d'e-mails. Ces informations sont nécessaires pour envoyer des e-mails depuis l'application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                                Sécurisez votre connexion avec le chiffrement SSL/TLS.
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
                                <span>{isFormReady ? "Prêt à tester ou sauvegarder" : "Veuillez remplir les champs requis"}</span>
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
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
