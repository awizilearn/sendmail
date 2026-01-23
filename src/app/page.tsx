
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Header from "@/components/mail-pilot/Header";
import ExcelImporter from "@/components/mail-pilot/ExcelImporter";
import DataTable from "@/components/mail-pilot/DataTable";
import EmailComposer from "@/components/mail-pilot/EmailComposer";
import SmtpSettings from "@/components/mail-pilot/SmtpSettings";
import { Card, CardContent } from "@/components/ui/card";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import UserGuide from "@/components/mail-pilot/UserGuide";
import { useToast } from "@/hooks/use-toast";
import type { MailRecipient } from "@/types/mail-recipient";

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

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onLogout={handleLogout} />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <UserGuide />
        <ExcelImporter onDataImported={handleDataImported} />
        
        <Card>
          <CardContent className="p-6 space-y-8">
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
