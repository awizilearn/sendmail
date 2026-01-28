
import * as XLSX from 'xlsx';
import type { MailRecipient } from '@/types/mail-recipient';

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

export const processExcelFile = (file: File): Promise<Omit<MailRecipient, 'id'>[]> => {
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

        if (jsonData.length < 2) {
          throw new Error("Le fichier Excel doit comporter une ligne d'en-tête et au moins une ligne de données.");
        }

        const headers = (jsonData[0] as string[]).map(h => h ? String(h).trim() : '');
        
        const emailColumnKey = headers.find(h => h.toLowerCase() === 'adresse mail');
        if (!emailColumnKey) {
            throw new Error("La colonne requise 'adresse mail' n'a pas été trouvée dans le fichier.");
        }

        const civilityTrainerKey = headers.find(h => h.toLowerCase() === 'civilité formateur');
        const rdvDateKey = headers.find(h => h.toLowerCase() === 'date du rdv');
        
        const defaultRdvDate = addWorkingDays(new Date(), 2);
        
        const rowsToImport: Omit<MailRecipient, 'id'>[] = [];

        jsonData.slice(1).forEach((rowArray) => {
            if (!rowArray || rowArray.length === 0) return; // Skip empty rows

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
                        // Create a new date in UTC using the parts of the excel-provided date.
                        // This avoids timezone conversion issues where the date could shift by a day.
                        const utcDate = new Date(Date.UTC(cell.getUTCFullYear(), cell.getUTCMonth(), cell.getUTCDate()));
                        recipient[header] = utcDate.toLocaleDateString('fr-FR', { timeZone: 'UTC' });
                    }
                } else {
                    recipient[header] = cell ?? '';
                }
            });

            if (!civilityTrainerKey) {
                recipient['Civilité Formateur'] = 'M.';
            }
            
            if (!rdvDateKey || !recipient[rdvDateKey]) {
              recipient['Date du RDV'] = defaultRdvDate.toLocaleDateString('fr-FR');
            }
            
            const emailValue = recipient[emailColumnKey] ? String(recipient[emailColumnKey]).trim() : '';
            if (emailValue) {
              rowsToImport.push(recipient);
            }
        });
        
        resolve(rowsToImport);

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
