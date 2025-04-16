import { Contact } from '@shared/schema';

/**
 * Generates a VCF format string from contact information
 * @param contacts Array of contacts
 * @returns VCF format string
 */
export function generateVcf(contacts: Contact[]): string {
  // VCF format based on vCard 3.0 standard
  const vcfEntries = contacts.map(contact => {
    // Format the phone number: remove non-digit characters except + at beginning
    const formattedPhone = contact.phoneNumber.replace(/[^\d+]/g, '');
    
    // Create vCard entry
    return `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL;TYPE=CELL:${formattedPhone}
END:VCARD`;
  });
  
  // Join all vCard entries with newlines
  return vcfEntries.join('\n');
}
