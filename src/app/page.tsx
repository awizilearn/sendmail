"use client";

import { useState } from "react";
import Header from "@/components/mail-pilot/Header";
import ExcelImporter from "@/components/mail-pilot/ExcelImporter";
import DataTable from "@/components/mail-pilot/DataTable";
import EmailComposer from "@/components/mail-pilot/EmailComposer";
import SmtpSettings from "@/components/mail-pilot/SmtpSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from 'xlsx';

// This will be our data structure for a row
export type MailRecipient = { [key: string]: string | number };

export default function Home() {
  const [recipients, setRecipients] = useState<MailRecipient[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<MailRecipient | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8 space-y-8">
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
                  <SmtpSettings recipientCount={recipients.length} />
                </div>
                <div className="lg:mt-0">
                  <EmailComposer 
                    key={selectedRecipient ? JSON.stringify(selectedRecipient) : 'empty'}
                    selectedRecipient={selectedRecipient} 
                    headers={headers} 
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
