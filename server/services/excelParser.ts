import * as XLSX from 'xlsx';
import { Contact, contactSchema } from '@shared/schema';

/**
 * Extracts contact information from an Excel file buffer
 * @param buffer Excel file buffer
 * @returns Array of contacts
 */
export async function excelToContacts(buffer: Buffer): Promise<Contact[]> {
  try {
    // Parse the Excel buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in the Excel file');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (jsonData.length === 0) {
      throw new Error('The Excel file is empty');
    }
    
    // Extract contacts
    const contacts: Contact[] = [];
    let nameHeaderFound = false;
    let phoneHeaderFound = false;
    
    // Identify the column headers for name and phone
    const possibleNameHeaders = ['name', 'full name', 'contact name', 'contact', 'person'];
    const possiblePhoneHeaders = ['phone', 'phone number', 'telephone', 'mobile', 'cell', 'number'];
    
    // Get the first row to check headers
    const firstRow = jsonData[0];
    const headers = Object.keys(firstRow).map(key => key.toLowerCase());
    
    // Find the correct header names
    let nameHeader: string | null = null;
    let phoneHeader: string | null = null;
    
    for (const header of headers) {
      const headerLower = header.toLowerCase();
      
      // Check if this header is for name
      if (!nameHeader && possibleNameHeaders.some(h => headerLower.includes(h))) {
        nameHeader = header;
        nameHeaderFound = true;
      }
      
      // Check if this header is for phone
      if (!phoneHeader && possiblePhoneHeaders.some(h => headerLower.includes(h))) {
        phoneHeader = header;
        phoneHeaderFound = true;
      }
      
      // If both headers are found, stop searching
      if (nameHeader && phoneHeader) break;
    }
    
    // If headers are not found, use the first two columns as fallback
    if (!nameHeader && headers.length > 0) {
      nameHeader = headers[0];
      nameHeaderFound = true;
    }
    
    if (!phoneHeader && headers.length > 1) {
      phoneHeader = headers[1];
      phoneHeaderFound = true;
    }
    
    if (!nameHeaderFound || !phoneHeaderFound) {
      throw new Error('Could not find name or phone number columns in the Excel file');
    }
    
    // Process each row
    for (const row of jsonData) {
      const name = row[nameHeader!]?.toString().trim();
      const phoneNumber = row[phoneHeader!]?.toString().trim();
      
      if (name && phoneNumber) {
        try {
          // Validate contact data
          const contact = contactSchema.parse({
            id: contacts.length + 1, // Assign a temporary ID
            name,
            phoneNumber
          });
          
          contacts.push(contact);
        } catch (error) {
          // Skip invalid contacts
          console.warn(`Skipping invalid contact: ${name}, ${phoneNumber}`);
        }
      }
    }
    
    return contacts;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to parse Excel file');
  }
}
