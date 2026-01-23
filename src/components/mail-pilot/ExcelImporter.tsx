
"use client";

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileCheck2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { MailRecipient } from '@/types/mail-recipient';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

type ExcelImporterProps = {
  onDataImported: (data: MailRecipient[]) => void;
};

export default function ExcelImporter({ onDataImported }: ExcelImporterProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processFile = (file: File | null) => {
    if (!file) {
      setFileName('');
      return;
    }

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
        
        const rdvDate = addWorkingDays(new Date(), 2);
        
        const rowsToImport: MailRecipient[] = [];

        jsonData.slice(1).forEach((rowArray, index) => {
            const recipient: MailRecipient = { id: `local-recipient-${index}` };
            
            headers.forEach((header, cellIndex) => {
                const cell = (rowArray as any[])[cellIndex];
                if (header) {
                    if (cell instanceof Date) {
                        const lowerHeader = header.toLowerCase();
                        if (lowerHeader.includes('heure') || lowerHeader === 'fin rdv') {
                            recipient[header] = cell.toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        } else {
                            recipient[header] = cell.toLocaleDateString('fr-FR');
                        }
                    } else {
                        recipient[header] = cell ?? '';
                    }
                }
            });

            // If 'Civilité Formateur' column doesn't exist in source, add it with a default.
            if (!headers.includes('Civilité Formateur')) {
                recipient['Civilité Formateur'] = 'M.';
            }

            // Only set default 'Date du RDV' if it wasn't in the imported file
            if (!recipient['Date du RDV']) {
              recipient['Date du RDV'] = rdvDate.toLocaleDateString('fr-FR');
            }
            
            const emailValue = recipient[emailColumn] ? String(recipient[emailColumn]).trim() : '';
            if (emailValue) {
              rowsToImport.push(recipient);
            }
        });
        
        onDataImported(rowsToImport);
        
        toast({
          title: 'Succès',
          description: `${rowsToImport.length} enregistrements importés.`,
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
    processFile(file || null);
    // Reset file input to allow re-uploading the same file
    if (!file && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }
  
  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFileName('');
    onDataImported([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    toast({
      title: 'Fichier retiré',
      description: 'La liste des destinataires a été vidée. Vous pouvez télécharger un nouveau fichier.',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Upload Data</CardTitle>
        <CardDescription>Step 1 of 4: Upload your excel file and verify the data mapping.</CardDescription>
      </CardHeader>
      <CardContent>
        <label 
          htmlFor="dropzone-file" 
          onDrop={handleDrop} 
          onDragOver={e => e.preventDefault()} 
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50 border-border relative transition-colors",
            isDragOver && "bg-accent/80 border-primary"
          )}
        >
          <div className="flex flex-col items-center justify-center text-center p-6">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            {fileName ? (
              <>
                <FileCheck2 className="w-8 h-8 text-green-500 mb-2" />
                <p className="text-lg font-semibold text-foreground">{fileName}</p>
                <p className="text-sm text-muted-foreground">{loading ? "Traitement en cours..." : "Fichier chargé avec succès."}</p>
                 <button onClick={handleReset} className="absolute top-4 right-4 p-1 rounded-full bg-muted/50 hover:bg-muted text-foreground/50 hover:text-foreground"><X className="w-5 h-5" /></button>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold">Upload your Excel file</p>
                <p className="text-sm text-muted-foreground">Drag and drop your .xlsx or .csv file here or click to browse.</p>
                <Button variant="default" size="sm" className="mt-4" onClick={() => fileInputRef.current?.click()}>Select File</Button>
              </>
            )}
          </div>
          <Input id="dropzone-file" type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" disabled={loading} />
        </label>
      </CardContent>
    </Card>
  );
}
