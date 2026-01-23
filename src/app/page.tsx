
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { LayoutDashboard, Upload, Mail, Users, Settings, LogOut } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { MailRecipient } from "@/types/mail-recipient";
import Link from 'next/link';


import ExcelImporter from "@/components/mail-pilot/ExcelImporter";
import DataTable from "@/components/mail-pilot/DataTable";
import EmailComposer from "@/components/mail-pilot/EmailComposer";
import SmtpSettings from "@/components/mail-pilot/SmtpSettings";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NsConseilLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="hsl(var(--primary))"/>
        <g transform="translate(0 -2)">
            <path d="M16 4L26 16L16 28L6 16L16 4Z" stroke="hsl(var(--primary-foreground))" strokeWidth="2"/>
            <text x="16" y="18.5" textAnchor="middle" dy=".3em" fontSize="11" fontWeight="bold" fill="hsl(var(--primary))">TH</text>
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

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [recipients, setRecipients] = useState<MailRecipient[]>([]);
  const [recipientsForSmtp, setRecipientsForSmtp] = useState<MailRecipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<MailRecipient | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [emailSubject, setEmailSubject] = useState(`Confirmation de votre rendez-vous avec {{Formateur/Formatrice}} votre {{formateur/formatrice}} {{PLATEFORME}}`);
  const [emailBody, setEmailBody] = useState(`Bonjour {{Civilité}} {{Bénéficiare}},

Nous vous confirmons votre prochain rendez-vous pour la continuité de votre formation.
Le {{Date du RDV}} de {{Heure RDV}} à {{Fin RDV}}.
Veuillez tenir informé votre {{formateur/formatrice}} en cas d'empêchement.

Cordialement`);

  const [sentEmailKeys, setSentEmailKeys] = useState(new Set<string>());

  const handleDataImported = (data: MailRecipient[]) => {
    setRecipients(data);
    setSelectedRecipient(null);
    setSentEmailKeys(new Set<string>()); // Reset sent history on new import
  };

  const handleClearRecipients = () => {
    setRecipients([]);
    setRecipientsForSmtp([]);
    setSelectedRecipient(null);
    setSentEmailKeys(new Set<string>());
    toast({ title: "Données effacées", description: "La liste des destinataires a été vidée." });
  };
  
  const handleLogEmail = (key: string) => {
    setSentEmailKeys(prev => new Set(prev).add(key));
  };

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleRowSelect = (recipient: MailRecipient | null) => {
    setSelectedRecipient(recipient);
  };
  
  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast({ title: "Déconnexion réussie", description: "Vous avez été déconnecté." });
      router.push('/login');
    }
  };

  const getInitials = (email?: string | null, name?: string | null) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return '?';
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }
  
  const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "#", icon: Mail, label: "Email Logs" },
    { href: "/", icon: Upload, label: "Excel Import" },
    { href: "#", icon: Users, label: "Beneficiaries" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden w-64 flex-col border-r bg-white p-4 sm:flex">
        <div className="flex items-center gap-3 mb-8">
            <NsConseilLogo />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-primary">
                TrainingHub
              </h1>
              <p className="text-xs text-muted-foreground">Automation Center</p>
            </div>
        </div>
        <nav className="flex flex-col gap-2">
           {navLinks.map(link => (
              <NavLink key={link.href} href={link.href} active={link.href === '/'}>
                  <link.icon className="h-4 w-4" /> {link.label}
              </NavLink>
          ))}
        </nav>
        <div className="mt-auto">
            <nav className="flex flex-col gap-2 mb-4">
                <NavLink href="#"><Settings className="h-4 w-4" /> Settings</NavLink>
            </nav>
            {user && (
            <div className="flex items-center gap-3 rounded-lg p-2">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || "#"} alt="Avatar" />
                    <AvatarFallback>{getInitials(user.email, user.displayName || "Admin Account")}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                    <p className="text-sm font-medium leading-none">
                    Admin Account
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Pro Plan
                    </p>
                </div>
            </div>
           )}
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 space-y-8 overflow-auto">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Excel Import</p>
            <h1 className="text-3xl font-bold tracking-tight">Import Appointment Data</h1>
          </div>
        </header>

        <div className="space-y-8">
          <ExcelImporter onDataImported={handleDataImported} />
          
          <div className="space-y-8">
              <DataTable 
                recipients={recipients}
                onClear={handleClearRecipients}
                onSelectionChange={setRecipientsForSmtp}
                onHeadersLoaded={setHeaders}
                selectedRow={selectedRecipient}
                onRowSelect={handleRowSelect}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <EmailComposer 
                  key={selectedRecipient ? JSON.stringify(selectedRecipient) : 'empty'}
                  selectedRecipient={selectedRecipient}
                  headers={headers}
                  subject={emailSubject}
                  onSubjectChange={setEmailSubject}
                  body={emailBody}
                  onBodyChange={setEmailBody}
                />
                <SmtpSettings 
                  recipients={recipientsForSmtp}
                  emailBody={emailBody}
                  emailSubject={emailSubject}
                  sentEmailKeys={sentEmailKeys}
                  onEmailLogged={handleLogEmail}
                />
              </div>
          </div>
        </div>
      </main>
    </div>
  );
}
