
"use client";

import { useState, useRef } from 'react';
import { UploadCloud, FileCheck2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { MailRecipient } from '@/types/mail-recipient';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { processExcelFile } from '@/lib/excel-processor';

type ExcelImporterProps = {
  onDataImported: (data: Omit<MailRecipient, 'id'>[]) => void;
};

export default function ExcelImporter({ onDataImported }: ExcelImporterProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcessing = (file: File | null) => {
    if (!file) {
      setFileName('');
      return;
    }

    setLoading(true);
    setFileName(file.name);

    processExcelFile(file)
      .then(importedData => {
        onDataImported(importedData);
        if (importedData.length > 0) {
          toast({
            title: 'Succès',
            description: `${importedData.length} enregistrements importés.`,
            className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600'
          });
        }
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          variant: 'destructive',
          title: 'Échec de l\'importation',
          description: `Impossible de traiter le fichier Excel. ${errorMessage}`,
        });
        setFileName('');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileProcessing(file);
    }
    // Reset file input to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFileProcessing(file);
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
        <CardTitle className="text-2xl">Importer votre fichier</CardTitle>
        <CardDescription>Téléchargez votre fichier Excel (.xlsx, .xls, .csv) contenant la liste des destinataires.</CardDescription>
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
                <p className="text-lg font-semibold">Téléchargez votre fichier Excel</p>
                <p className="text-sm text-muted-foreground">Glissez-déposez votre fichier .xlsx ou .csv ici ou cliquez pour parcourir.</p>
                <Button variant="default" size="sm" className="mt-4" onClick={() => fileInputRef.current?.click()}>Sélectionner un fichier</Button>
              </>
            )}
          </div>
          <Input id="dropzone-file" type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" disabled={loading} />
        </label>
      </CardContent>
    </Card>
  );
}
