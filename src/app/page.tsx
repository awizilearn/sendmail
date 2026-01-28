
"use client";

import { useState, useMemo, useCallback } from "react";
import { collection, query, where, writeBatch, getDocs, doc } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { MailRecipient } from "@/types/mail-recipient";
import type { ProcessedExcelData } from "@/lib/excel-processor";

import ExcelImporter from "@/components/mail-pilot/ExcelImporter";
import DataTable from "@/components/mail-pilot/DataTable";
import EmailComposer from "@/components/mail-pilot/EmailComposer";
import EmailSender from "@/components/mail-pilot/EmailSender";
import UserGuide from "@/components/mail-pilot/UserGuide";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [currentTab, setCurrentTab] = useState("import");
  const [selectedRecipient, setSelectedRecipient] = useState<MailRecipient | null>(null);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());
  const [headers, setHeaders] = useState<string[]>([]);
  
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

  const recipientsForSending = useMemo(() => {
      if (!recipients) return [];
      // Filter recipients to include only those whose IDs are in the selectedIds set.
      return recipients.filter(r => selectedIds.has(r.id));
  }, [recipients, selectedIds]);

  const handleClearRecipients = useCallback(async (showToast = true) => {
    if (!recipientsQuery || !firestore) return;
    
    try {
      const querySnapshot = await getDocs(recipientsQuery);
      if (querySnapshot.empty && showToast) {
        toast({ title: "Données effacées", description: "La liste des destinataires était déjà vide." });
        return;
      }

      const batch = writeBatch(firestore);
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      setSelectedRecipient(null);
      setSelectedIds(new Set());
      setHeaders([]); // Clear headers
      setCurrentTab("import"); // Go back to import tab after clearing
      if (showToast) toast({ title: "Données effacées", description: "La liste des destinataires a été vidée." });
    } catch (error) {
        console.error("Error clearing recipients: ", error);
        if (showToast) toast({ variant: "destructive", title: "Erreur", description: "Impossible de vider la liste des destinataires." });
    }
  }, [recipientsQuery, firestore, toast]);

  const handleDataImported = useCallback(async (result: ProcessedExcelData) => {
    const { data, headers: importedHeaders } = result;
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Erreur", description: "Utilisateur non authentifié." });
      return;
    }
  
    // Clear existing data before importing new data.
    await handleClearRecipients(false);
  
    if (data.length === 0) {
      return; // Do nothing if the imported file is empty or it was a reset
    }
  
    setHeaders(importedHeaders);

    const batch = writeBatch(firestore);
    const recipientsCollection = collection(firestore, 'recipients');
    const newIds = new Set<string>();
    
    data.forEach(recipient => {
      const newDocRef = doc(recipientsCollection);
      batch.set(newDocRef, { ...recipient, ownerId: user.uid });
      newIds.add(newDocRef.id);
    });
  
    try {
      await batch.commit();
      setSelectedIds(newIds); // Auto-select all new recipients
      setCurrentTab("send"); // Automatically switch to the next step
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
            <p className="text-sm text-muted-foreground">envoi mail J-4</p>
            <h1 className="text-3xl font-bold tracking-tight">Envoyer des e-mails en masse</h1>
          </div>
        </header>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="import">Étape 1: Importer & Préparer</TabsTrigger>
                <TabsTrigger value="send" disabled={!recipients || recipients.length === 0}>
                    Étape 2: Composer & Envoyer
                </TabsTrigger>
            </TabsList>
            <TabsContent value="import" className="mt-6 space-y-8">
                <ExcelImporter onDataImported={handleDataImported} />
                <UserGuide />
            </TabsContent>
            <TabsContent value="send" className="mt-6 space-y-8">
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
                  <EmailSender 
                    recipients={recipientsForSending}
                    emailBody={emailBody}
                    emailSubject={emailSubject}
                  />
                </div>
            </TabsContent>
        </Tabs>
    </DashboardLayout>
  );
}
