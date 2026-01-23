import type { MailRecipient } from '@/app/page';

const placeholderRegex = /\{\{([^}]+)\}\}/g;

export function replacePlaceholders(text: string, data: MailRecipient | null): string {
    if (!data) return text;
    
    return text.replace(placeholderRegex, (match, key) => {
      const trimmedKey = key.trim();
      const lowerKey = trimmedKey.toLowerCase();
      
      // Custom logic for "formateur/formatrice"
      if (lowerKey === 'formateur/formatrice') {
        const civilityFormateur = String(data['Civilité Formateur'] || '').trim().toLowerCase();
        return civilityFormateur === 'mme' || civilityFormateur === 'mme.' ? 'formatrice' : 'formateur';
      }
      
      // Custom logic for "Civilité"
      if (lowerKey === 'civilité') {
        const civility = String(data[trimmedKey] || data['Civilité'] || '').trim().toLowerCase();
        if (civility === 'mr' || civility === 'm.') {
          return 'monsieur';
        }
        if (civility === 'mme' || civility === 'mme.') {
          return 'madame';
        }
        if (civility === 'mlle') {
          return 'mademoiselle';
        }
        // Fallback for other values
        return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : match;
      }
      
      // Generic fallback for all other keys
      return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : match;
    });
}
