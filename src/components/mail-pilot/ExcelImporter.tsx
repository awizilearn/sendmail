
"use client";

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileCheck2, X, FileUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { MailRecipient } from '@/app/page';
import { CollectionReference, doc, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

type ExcelImporterProps = {
  recipientsColRef: CollectionReference;
};

export default function ExcelImporter({ recipientsColRef }: ExcelImporterProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firestore = useFirestore();

  const addWorkingDays = (date: Date, days: number): Date => {
    const newDate = new Date(date);
    let added = 0;
    while (added < days) {
      newDate.setDate(newDate.getDate() + 1);
      const dayOfWeek = newDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
        added++;
      }
    }
    return newDate;
  };

  const processFile = (file: File) => {
    setLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, {
          header: 1,
          defval: "",
        });

        if (jsonData.length < 2) {
          throw new Error("Le fichier Excel doit comporter une ligne d'en-tête et au moins une ligne de données.");
        }

        const headers = (jsonData[0] as string[]).map(h => h.trim());
        const emailColumn = 'adresse mail';
        const emailColumnIndex = headers.findIndex(h => h.trim().toLowerCase() === emailColumn);
        
        if (emailColumnIndex === -1) {
            throw new Error(`La colonne requise '${emailColumn}' n'a pas été trouvée dans le fichier.`);
        }

        if (!headers.includes('Civilité Formateur')) {
          headers.push('Civilité Formateur');
        }
        
        const rdvDate = addWorkingDays(new Date(), 2);
        
        const uniqueRows: MailRecipient[] = [];
        const seenEmails = new Set<string>();
        let duplicateCount = 0;

        jsonData.slice(1).forEach(rowArray => {
            const email = rowArray[emailColumnIndex];
            if (email && seenEmails.has(email)) {
                duplicateCount++;
                return;
            }
            if(email) {
                seenEmails.add(email);
            }

            const recipient: MailRecipient = {};
            (rowArray as (string|number|Date)[]).forEach((cell, index) => {
                if (headers[index] && headers[index] !== 'Civilité Formateur') {
                    if (cell instanceof Date) {
                        recipient[headers[index]] = cell.toLocaleDateString('fr-FR');
                    } else {
                        recipient[headers[index]] = cell;
                    }
                }
            });

            if (rowArray.length < headers.length) {
                recipient['Civilité Formateur'] = 'M.'; 
            }
            recipient['Date du RDV'] = rdvDate.toLocaleDateString('fr-FR');
            
            const emailValue = String(recipient[emailColumn]).trim();
            if (emailValue) {
              recipient.id = emailValue;
              uniqueRows.push(recipient);
            }
        });
        
        const batch = writeBatch(firestore);
        uniqueRows.forEach(recipient => {
            const docRef = doc(recipientsColRef, String(recipient.id));
            batch.set(docRef, recipient);
        });
        await batch.commit();

        let successMessage = `${uniqueRows.length} enregistrements importés et sauvegardés avec succès.`;
        if (duplicateCount > 0) {
            toast({
              title: 'Doublons trouvés',
              description: `${duplicateCount} ligne(s) en double basée sur l'adresse e-mail a/ont été ignorée(s).`,
            });
        }

        toast({
          title: 'Succès',
          description: successMessage,
          className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600'
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          variant: 'destructive',
          title: 'Échec de l\'importation',
          description: `Impossible de traiter le fichier Excel. ${errorMessage}`,
        });
        setFileName('');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = (error) => {
      toast({
        variant: 'destructive',
        title: 'Erreur de lecture du fichier',
        description: "Une erreur s'est produite lors de la lecture du fichier.",
      });
      setLoading(false);
      setFileName('');
    };
    reader.readAsBinaryString(file);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  }
  
  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFileName('');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-lg flex items-center justify-center"><FileUp className="w-6 h-6"/></div>
          1. Importer les données
        </CardTitle>
        <CardDescription className="pl-12">Téléchargez la liste des destinataires au format .xlsx, .xls ou .csv. Assurez-vous d'inclure une colonne 'Civilité Formateur' ('M.' ou 'Mme') pour un affichage correct.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file" onDrop={handleDrop} onDragOver={e => e.preventDefault()} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50 border-border relative">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {fileName ? <FileCheck2 className="w-8 h-8 mb-4 text-green-500" /> : <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />}
              {fileName ? (
                <p className="text-sm text-foreground"><span className="font-semibold">{fileName}</span></p>
              ) : (
                <>
                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Cliquez pour télécharger</span> ou glisser-déposer</p>
                  <p className="text-xs text-muted-foreground">XLSX, XLS or CSV</p>
                </>
              )}
              {loading && <p className="text-xs text-primary mt-2">Traitement en cours...</p>}
            </div>
            <Input id="dropzone-file" type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" disabled={loading} />
            {fileName && (
              <button onClick={handleReset} className="absolute top-2 right-2 p-1 rounded-full bg-muted/50 hover:bg-muted"><X className="w-4 h-4" /></button>
            )}
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
