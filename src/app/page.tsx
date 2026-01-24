
"use client";

import { useState } from "react";
import type { MailRecipient } from "@/types/mail-recipient";

import ExcelImporter from "@/components/mail-pilot/ExcelImporter";
import DataTable from "@/components/mail-pilot/DataTable";
import EmailComposer from "@/components/mail-pilot/EmailComposer";
import SmtpSettings from "@/components/mail-pilot/SmtpSettings";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function Home() {
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

  const handleRowSelect = (recipient: MailRecipient | null) => {
    setSelectedRecipient(recipient);
  };

  return (
    <DashboardLayout>
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Imports Excel</p>
            <h1 className="text-3xl font-bold tracking-tight">Importer les données de rendez-vous</h1>
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
    </DashboardLayout>
  );
}
