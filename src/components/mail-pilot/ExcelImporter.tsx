"use client";

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileCheck2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { MailRecipient } from '@/app/page';

type ExcelImporterProps = {
  onDataImported: (data: MailRecipient[], headers: string[]) => void;
};

export default function ExcelImporter({ onDataImported }: ExcelImporterProps) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
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
          throw new Error('Excel file must have a header row and at least one data row.');
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1).map(rowArray => {
          const recipient: MailRecipient = {};
          (rowArray as (string|number|Date)[]).forEach((cell, index) => {
            if (headers[index]) {
                if (cell instanceof Date) {
                    recipient[headers[index]] = cell.toLocaleDateString();
                } else {
                    recipient[headers[index]] = cell;
                }
            }
          });
          return recipient;
        });

        onDataImported(rows, headers);
        toast({
          title: 'Success',
          description: `${rows.length} records imported successfully from ${file.name}.`,
          className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: `Could not process the Excel file. ${errorMessage}`,
        });
        setFileName('');
        onDataImported([], []);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = (error) => {
      toast({
        variant: 'destructive',
        title: 'File Read Error',
        description: 'There was an error reading the file.',
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
  
  const handleReset = () => {
    setFileName('');
    onDataImported([], []);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary p-2 rounded-lg"><UploadCloud className="w-5 h-5"/></div>
          1. Import Data
        </CardTitle>
        <CardDescription>Upload your recipient list in .xlsx, .xls, or .csv format.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center w-full">
          <label htmlFor="dropzone-file" onDrop={handleDrop} onDragOver={e => e.preventDefault()} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/10 border-border relative">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {fileName ? <FileCheck2 className="w-8 h-8 mb-4 text-green-500" /> : <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />}
              {fileName ? (
                <p className="text-sm text-foreground"><span className="font-semibold">{fileName}</span></p>
              ) : (
                <>
                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-muted-foreground">XLSX, XLS or CSV</p>
                </>
              )}
              {loading && <p className="text-xs text-primary mt-2">Processing...</p>}
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
