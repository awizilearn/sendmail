
"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Header from "@/components/mail-pilot/Header";
import ExcelImporter from "@/components/mail-pilot/ExcelImporter";
import DataTable from "@/components/mail-pilot/DataTable";
import EmailComposer from "@/components/mail-pilot/EmailComposer";
import SmtpSettings from "@/components/mail-pilot/SmtpSettings";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from 'xlsx';
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import UserGuide from "@/components/mail-pilot/UserGuide";

// This will be our data structure for a row
export type MailRecipient = { [key: string]: string | number };

export default function Home() {
  const [recipients, setRecipients] = useState<MailRecipient[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<MailRecipient | null>(null);
  const [emailSubject, setEmailSubject] = useState(`Confirmation de votre rendez-vous avec {{Formateur/Formatrice}} votre formateur {{PLATEFORME}}`);
  const [emailBody, setEmailBody] = useState(`Bonjour {{Civilité}} {{Bénéficiare}},

Nous vous confirmons votre prochain rendez-vous pour la continuité de votre formation :
Le {{Date du RDV}} de {{Heure RDV}} à {{Fin RDV}}.
Veuillez tenir informé votre {{formateur/formatrice}} en cas d'empêchement.

Cordialement`);

  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);


  const handleDataImported = (data: MailRecipient[], sheetHeaders: string[]) => {
    setRecipients(data);
    setHeaders(sheetHeaders);
    if (data.length > 0) {
      setSelectedRecipient(data[0]);
    } else {
      setSelectedRecipient(null);
    }
  };

  const handleRowSelect = (recipient: MailRecipient) => {
    setSelectedRecipient(recipient);
  };
  
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(recipients);
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

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Loading...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onLogout={handleLogout} userEmail={user.email} />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
        <UserGuide />
        <ExcelImporter onDataImported={handleDataImported} />
        
        {recipients.length > 0 && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <DataTable 
                    data={recipients} 
                    headers={headers} 
                    selectedRow={selectedRecipient} 
                    onRowSelect={handleRowSelect} 
                    onExport={handleExport}
                  />
                  <SmtpSettings 
                    recipientCount={recipients.length}
                    recipients={recipients}
                    emailBody={emailBody}
                    emailSubject={emailSubject}
                  />
                </div>
                <div className="lg:mt-0">
                  <EmailComposer 
                    key={selectedRecipient ? JSON.stringify(selectedRecipient) : 'empty'}
                    selectedRecipient={selectedRecipient} 
                    headers={headers} 
                    subject={emailSubject}
                    onSubjectChange={setEmailSubject}
                    body={emailBody}
                    onBodyChange={setEmailBody}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
