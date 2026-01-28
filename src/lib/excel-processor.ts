
import * as XLSX from 'xlsx';
import type { MailRecipient } from '@/types/mail-recipient';

export type ProcessedExcelData = {
  data: Omit<MailRecipient, 'id'>[];
  headers: string[];
};

export const processExcelFile = (file: File): Promise<ProcessedExcelData> => {
  return new Promise((resolve, reject) => {
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

        if (jsonData.length < 1) {
          resolve({ data: [], headers: [] });
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => h ? String(h).trim() : '');
        
        const emailColumnKey = headers.find(h => h.toLowerCase() === 'adresse mail');
        if (!emailColumnKey && jsonData.length > 1) { // Only require email if there's data
            throw new Error("La colonne requise 'adresse mail' n'a pas été trouvée dans le fichier.");
        }
        
        const rowsToImport: Omit<MailRecipient, 'id'>[] = [];

        jsonData.slice(1).forEach((rowArray) => {
            if (!rowArray || rowArray.length === 0 || rowArray.every(cell => cell === '')) return; // Skip empty/blank rows

            const recipient: { [key: string]: string | number } = {};
            
            headers.forEach((header, cellIndex) => {
                if (!header) return; // Skip empty headers
                const cell = (rowArray as any[])[cellIndex];

                if (cell instanceof Date) {
                    const lowerHeader = header.toLowerCase();
                    if (lowerHeader.includes('heure') || lowerHeader === 'fin rdv') {
                        recipient[header] = cell.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    } else {
                        // The 'xlsx' library parses dates as UTC. We must read them as UTC to avoid timezone shifts.
                        const year = cell.getUTCFullYear();
                        const month = cell.getUTCMonth() + 1; // getUTCMonth() is 0-indexed
                        const day = cell.getUTCDate();

                        // Manually construct the DD/MM/YYYY string.
                        const dayString = String(day).padStart(2, '0');
                        const monthString = String(month).padStart(2, '0');
                        
                        recipient[header] = `${dayString}/${monthString}/${year}`;
                    }
                } else {
                    recipient[header] = cell ?? '';
                }
            });
            
            const emailValue = emailColumnKey ? String(recipient[emailColumnKey]).trim() : '';
            if (emailValue) {
              rowsToImport.push(recipient);
            }
        });
        
        resolve({ data: rowsToImport, headers });

      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(new Error("Une erreur s'est produite lors de la lecture du fichier."));
    };
    
    reader.readAsBinaryString(file);
  });
};
