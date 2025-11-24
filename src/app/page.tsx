
"use client";

import { useState, useEffect } from "react";
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
import { collection } from "firebase/firestore";
import * as XLSX from 'xlsx';

export type MailRecipient = { [key: string]: string | number };

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const [selectedRecipient, setSelectedRecipient] = useState<MailRecipient | null>(null);
  const [allRecipients, setAllRecipients] = useState<MailRecipient[]>([]);
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

  const handleRowSelect = (recipient: MailRecipient) => {
    setSelectedRecipient(recipient);
  };

  const handleDataLoaded = (data: MailRecipient[], sheetHeaders: string[]) => {
    setAllRecipients(data);
    setHeaders(sheetHeaders);
    if (data.length > 0 && !selectedRecipient) {
      setSelectedRecipient(data[0]);
    } else if (data.length === 0) {
      setSelectedRecipient(null);
    }
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(allRecipients);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recipients");
    XLSX.writeFile(workbook, "recipients.xlsx");
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (isUserLoading || !user || !firestore) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  const recipientsColRef = collection(firestore, 'users', user.uid, 'recipients');

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onLogout={handleLogout} />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <UserGuide />
        <ExcelImporter recipientsColRef={recipientsColRef} />
        
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-8">
            <DataTable 
              recipientsColRef={recipientsColRef}
              onDataLoaded={handleDataLoaded}
              selectedRow={selectedRecipient}
              onRowSelect={handleRowSelect}
              onExport={handleExport}
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
                recipientCount={allRecipients.length}
                recipients={allRecipients}
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
