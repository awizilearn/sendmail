
import type { MailRecipient } from '@/types/mail-recipient';

const placeholderRegex = /\{\{([^}]+)\}\}/g;

export function replacePlaceholders(text: string, data: MailRecipient | null): string {
    if (!data) return text;
    
    return text.replace(placeholderRegex, (match, key) => {
      const trimmedKey = key.trim();

      // Custom logic for the title "formateur" or "formatrice"
      // This MUST be a case-sensitive match on the placeholder to distinguish it from the name placeholder.
      if (trimmedKey.toLowerCase() === 'formateur/formatrice') {
        // Find the 'Civilité Formateur' key case-insensitively to get the value
        const civilityKey = Object.keys(data).find(k => k.toLowerCase().trim() === 'civilité formateur');
        const civilityFormateur = civilityKey ? String(data[civilityKey] || '').trim().toLowerCase() : '';
        return civilityFormateur === 'mme' || civilityFormateur === 'mme.' ? 'formatrice' : 'formateur';
      }

      const lowerTrimmedKey = trimmedKey.toLowerCase();
      // Find the corresponding key in the data object, case-insensitively
      const dataKey = Object.keys(data).find(k => k.toLowerCase() === lowerTrimmedKey);

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
