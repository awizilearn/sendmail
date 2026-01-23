
import type { MailRecipient } from '@/types/mail-recipient';

const placeholderRegex = /\{\{([^}]+)\}\}/g;

export function replacePlaceholders(text: string, data: MailRecipient | null): string {
    if (!data) return text;
    
    return text.replace(placeholderRegex, (match, key) => {
      const trimmedKey = key.trim();

      // Custom logic for the title "formateur" or "formatrice"
      // This MUST be an exact, case-sensitive match on the placeholder to distinguish it from the name placeholder.
      if (trimmedKey === 'formateur/formatrice') {
        const civilityKey = Object.keys(data).find(k => k.toLowerCase().trim() === 'civilité formateur');
        const civilityFormateur = civilityKey ? String(data[civilityKey] || '').trim().toLowerCase() : '';
        
        if (civilityFormateur === 'mme' || civilityFormateur === 'mme.') {
            return 'formatrice';
        }
        return 'formateur';
      }

      // For all other keys, find the corresponding key in the data object, case-insensitively.
      const lowerTrimmedKey = trimmedKey.toLowerCase();
      const dataKey = Object.keys(data).find(k => k.toLowerCase().trim() === lowerTrimmedKey);

      // If we found a key in the data object...
      if (dataKey && data[dataKey] !== undefined) {
        // Special handling for 'Civilité' to expand it
        if (lowerTrimmedKey === 'civilité') {
          const civility = String(data[dataKey]).trim().toLowerCase();
          if (civility === 'mr' || civility === 'm.') {
            return 'monsieur';
          }
          if (civility === 'mme' || civility === 'mme.') {
            return 'madame';
          }
          if (civility === 'mlle') {
            return 'mademoiselle';
          }
        }
        // For all other keys (like `Formateur/Formatrice` for the name), return the value directly.
        return String(data[dataKey]);
      }
      
      // If no key found in data, return the original placeholder
      return match;
    });
}
