
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { collection, query, where, writeBatch, getDocs, doc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { MailRecipient } from "@/types/mail-recipient";

import ExcelImporter from "@/components/mail-pilot/ExcelImporter";
import DataTable from "@/components/mail-pilot/DataTable";
import EmailComposer from "@/components/mail-pilot/EmailComposer";
import SmtpSettings from "@/components/mail-pilot/SmtpSettings";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function Home() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [selectedRecipient, setSelectedRecipient] = useState<MailRecipient | null>(null);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  
  const [emailSubject, setEmailSubject] = useState(`Confirmation de votre rendez-vous avec {{Formateur/Formatrice}} votre {{formateur/formatrice}} {{PLATEFORME}}`);
  const [emailBody, setEmailBody] = useState(`Bonjour {{Civilité}} {{Bénéficiare}},

Nous vous confirmons votre prochain rendez-vous pour la continuité de votre formation.
Le {{Date du RDV}} de {{Heure RDV}} à {{Fin RDV}}.
Veuillez tenir informé votre {{formateur/formatrice}} en cas d'empêchement.

Cordialement`);

  const recipientsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'recipients'), where('ownerId', '==', user.uid));
  }, [user, firestore]);

  const { data: recipients, isLoading: isLoadingRecipients } = useCollection<MailRecipient>(recipientsQuery);
  
  useEffect(() => {
    if (recipients) {
        const allIds = new Set(recipients.map(r => r.id).filter(Boolean));
        setSelectedIds(allIds);
    } else {
        setSelectedIds(new Set());
    }
  }, [recipients]);

  const headers = useMemo(() => {
      if (!recipients || recipients.length === 0) return [];
      const firstRecipientKeys = Object.keys(recipients[0]);
      return firstRecipientKeys.filter(key => key !== 'ownerId' && key !== 'id');
  }, [recipients]);

  const recipientsForSmtp = useMemo(() => {
      if (!recipients) return [];
      return recipients.filter(r => selectedIds.has(r.id));
  }, [recipients, selectedIds]);

  const handleClearRecipients = useCallback(async (showToast = true) => {
    if (!recipientsQuery || !firestore) return;
    
    try {
      const querySnapshot = await getDocs(recipientsQuery);
      if (querySnapshot.empty) {
        if (showToast) toast({ title: "Données effacées", description: "La liste des destinataires était déjà vide." });
        return;
      }

      const batch = writeBatch(firestore);
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      setSelectedRecipient(null);
      if (showToast) toast({ title: "Données effacées", description: "La liste des destinataires a été vidée." });
    } catch (error) {
        console.error("Error clearing recipients: ", error);
        if (showToast) toast({ variant: "destructive", title: "Erreur", description: "Impossible de vider la liste des destinataires." });
    }
  }, [recipientsQuery, firestore, toast]);

  const handleDataImported = useCallback(async (data: MailRecipient[]) => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Erreur", description: "Utilisateur non authentifié." });
      return;
    }

    // First, clear existing recipients for this user
    await handleClearRecipients(false);

    const batch = writeBatch(firestore);
    const recipientsCollection = collection(firestore, 'recipients');
    data.forEach(recipient => {
      const { id, ...rest } = recipient;
      const newDocRef = doc(recipientsCollection);
      batch.set(newDocRef, { ...rest, ownerId: user.uid });
    });

    try {
      await batch.commit();
      toast({ title: "Importation réussie", description: `${data.length} destinataires ont été enregistrés.` });
    } catch (error) {
      console.error("Error importing recipients: ", error);
      toast({ variant: "destructive", title: "Erreur d'importation", description: "Impossible d'enregistrer les destinataires." });
    }
  }, [user, firestore, toast, handleClearRecipients]);

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
                recipients={recipients || []}
                isLoading={isLoadingRecipients}
                onClear={handleClearRecipients}
                headers={headers}
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
                selectedRow={selectedRecipient}
                onRowSelect={setSelectedRecipient}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <EmailComposer 
                  key={selectedRecipient ? selectedRecipient.id : 'empty'}
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
          </div>
        </div>
    </DashboardLayout>
  );
}
