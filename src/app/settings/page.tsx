
'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { LayoutDashboard, Upload, Mail, Settings, Bell, Calendar, Zap, SlidersHorizontal, Eye, EyeOff, CheckCircle2, Info } from "lucide-react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from "@/lib/utils";
import { sendTestEmail } from '@/app/actions';

const NsConseilLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="hsl(var(--primary))"/>
        <g transform="translate(0 -2)">
            <path d="M16 4L26 16L16 28L6 16L16 4Z" stroke="hsl(var(--primary-foreground))" strokeWidth="2"/>
            <text x="16" y="18.5" textAnchor="middle" dy=".3em" fontSize="11" fontWeight="bold" fill="hsl(var(--primary))">TCP</text>
        </g>
    </svg>
);

const NavLink = ({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:bg-accent hover:text-accent-foreground",
      active && "bg-accent text-accent-foreground font-semibold"
    )}
  >
    {children}
  </Link>
);

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
  savePassword: z.boolean().default(false), // just for localstorage logic
});

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const form = useForm<z.infer<typeof smtpSchema>>({
        resolver: zodResolver(smtpSchema),
        defaultValues: { host: '', port: 587, user: '', pass: '', secure: true, savePassword: false },
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem('smtpSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                form.reset(settings);
            }
        } catch (error) {
            console.error("Failed to load SMTP settings from localStorage", error);
        }
    }, [form]);

    const formValues = form.watch();
    useEffect(() => {
        const { host, port, user } = formValues;
        setIsReady(!!host && !!port && !!user);
    }, [formValues]);

    const getInitials = (email?: string | null, name?: string | null) => {
        if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        if (email) return email.charAt(0).toUpperCase();
        return '?';
    };

    const handleSaveConfiguration = (values: z.infer<typeof smtpSchema>) => {
        setIsSaving(true);
        try {
            const { pass, ...settingsToSave } = values;
            const finalSettings = {
                ...settingsToSave,
                pass: values.savePassword ? pass : '',
            };
            localStorage.setItem('smtpSettings', JSON.stringify(finalSettings));
            toast({
                title: 'Configuration Enregistrée',
                description: 'Vos paramètres de connexion ont été sauvegardés.',
            });
        } catch (error) {
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

    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <p>Chargement...</p>
            </div>
        );
    }
    
    const navLinks = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
        { href: "#", icon: Calendar, label: "Rendez-vous" },
        { href: "/", icon: Upload, label: "Imports Excel" },
        { href: "/settings", icon: Mail, label: "Paramètres E-mail" },
        { href: "#", icon: Bell, label: "Notifications" },
    ];

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            <aside className="hidden w-64 flex-col border-r bg-white p-4 sm:flex">
                <div className="flex items-center gap-3 mb-8">
                    <NsConseilLogo />
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-primary">Training Center Pro</h1>
                        <p className="text-xs text-muted-foreground">Automation Suite</p>
                    </div>
                </div>
                <nav className="flex flex-col gap-2">
                    {navLinks.map(link => (
                        <NavLink key={link.href} href={link.href} active={link.href === '/settings'}>
                            <link.icon className="h-4 w-4" /> {link.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-auto">
                    <nav className="flex flex-col gap-2 mb-4">
                        <NavLink href="/settings"><Settings className="h-4 w-4" /> Paramètres</NavLink>
                    </nav>
                     {user && (
                        <div className="flex items-center gap-3 rounded-lg p-2">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.photoURL || "#"} alt="Avatar" />
                                <AvatarFallback>{getInitials(user.email, user.displayName || "Compte Admin")}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left">
                                <p className="text-sm font-medium leading-none">
                                Compte Admin
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                  Forfait Pro
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
            <main className="flex-1 p-4 md:p-8 space-y-8 overflow-auto">
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
                                <div className="flex items-center justify-between mt-4 border-t pt-6">
                                     <div className={cn("flex items-center gap-2 text-sm", isReady ? "text-green-600" : "text-muted-foreground")}>
                                        {isReady && <CheckCircle2 className="h-4 w-4" />}
                                        <span>{isReady ? "Prêt à tester la connexion" : "Veuillez remplir les champs requis"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="outline" onClick={form.handleSubmit(handleTestConnection)} disabled={!isReady || isTesting}>
                                            {isTesting ? "Test en cours..." : "Tester la connexion"}
                                        </Button>
                                        <Button type="submit" disabled={!isReady || isSaving}>
                                            {isSaving ? "Enregistrement..." : "Sauvegarder la configuration"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                           </Form>
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
            </main>
        </div>
    );
}
