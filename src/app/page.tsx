
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import Header from "@/components/mail-pilot/Header";
import ExcelImporter from "@/components/mail-pilot/ExcelImporter";
import DataTable from "@/components/mail-pilot/DataTable";
import EmailComposer from "@/components/mail-pilot/EmailComposer";
import SmtpSettings from "@/components/mail-pilot/SmtpSettings";
import { Card, CardContent } from "@/components/ui/card";
import { useUser, useAuth, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import UserGuide from "@/components/mail-pilot/UserGuide";
import { collection, type CollectionReference } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export type MailRecipient = { [key: string]: string | number };

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [recipientsForSmtp, setRecipientsForSmtp] = useState<MailRecipient[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<MailRecipient | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [emailSubject, setEmailSubject] = useState(`Confirmation de votre rendez-vous avec {{Formateur/Formatrice}} votre formateur {{PLATEFORME}}`);
  const [emailBody, setEmailBody] = useState(`Bonjour {{Civilité}} {{Bénéficiare}},

Nous vous confirmons votre prochain rendez-vous pour la continuité de votre formation.
Le {{Date du RDV}} de {{Heure RDV}} à {{Fin RDV}}.
Veuillez tenir informé votre {{formateur/formatrice}} en cas d'empêchement.

Cordialement`);


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

  const recipientsColRef = useMemo(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'recipients');
  }, [user, firestore]) as CollectionReference | null;


  if (isUserLoading || !user || !firestore) {
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
        <ExcelImporter recipientsColRef={recipientsColRef} />
        
        <Card>
          <CardContent className="p-6 space-y-8">
            <DataTable 
              recipientsColRef={recipientsColRef}
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
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
