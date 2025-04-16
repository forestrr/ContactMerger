import * as XLSX from 'xlsx';
import { Contact, contactSchema } from '@shared/schema';

/**
 * Extracts contact information from an Excel file buffer
 * @param buffer Excel file buffer
 * @returns Array of contacts
 */
export async function excelToContacts(buffer: Buffer): Promise<Contact[]> {
  try {
    // Try different read options for better compatibility
    let workbook: XLSX.WorkBook;
    
    try {
      // First try with standard options
      workbook = XLSX.read(buffer, { 
        type: 'buffer',
        raw: true,
        cellDates: true, 
        cellNF: false,
        cellText: false
      });
    } catch (e) {
      console.log("First Excel parse attempt failed, trying with different options", e);
      
      try {
        // Second attempt with different options
        workbook = XLSX.read(buffer, {
          type: 'buffer',
          codepage: 65001, // Try UTF-8
          cellDates: true
        });
      } catch (e2) {
        console.log("Second Excel parse attempt failed, trying with minimal options", e2);
        
        // Last attempt with minimal options
        workbook = XLSX.read(buffer, {
          type: 'buffer'
        });
      }
    }
    
    // Try all worksheets until we find valid contacts
    let worksheet: XLSX.WorkSheet | null = null;
    let sheetData: Record<string, unknown>[] = [];
    
    // Log all sheet names for debugging
    console.log('Available sheets:', workbook.SheetNames);
    
    // First try the first sheet
    if (workbook.SheetNames.length > 0) {
      const firstSheetName = workbook.SheetNames[0];
      worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with headers
      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { 
        header: "A",
        blankrows: false,
        defval: ""
      });
      
      if (data.length > 1) {
        sheetData = data;
      } else {
        // Try other sheets if the first one is empty
        for (let i = 1; i < workbook.SheetNames.length; i++) {
          const sheetName = workbook.SheetNames[i];
          worksheet = workbook.Sheets[sheetName];
          
          const otherSheetData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { 
            header: "A",
            blankrows: false,
            defval: ""
          });
          
          if (otherSheetData.length > 1) {
            console.log(`Using sheet: ${sheetName} with ${otherSheetData.length} rows`);
            sheetData = otherSheetData;
            break;
          }
        }
      }
    }
    
    if (!worksheet || sheetData.length <= 1) {
      throw new Error('No usable data found in any sheet of the Excel file');
    }
    
    // Log sample rows for debugging
    console.log('First row:', sheetData[0]);
    if (sheetData.length > 1) {
      console.log('Second row:', sheetData[1]);
    }
    
    // Extract contacts
    const contacts: Contact[] = [];
    
    // Define header synonyms
    const possibleNameHeaders = [
      'name', 'full name', 'contact name', 'contact', 'person', 'fullname', 
      'contactname', 'first name', 'firstname', 'last name', 'lastname', 'user'
    ];
    
    const possiblePhoneHeaders = [
      'phone', 'phone number', 'telephone', 'mobile', 'cell', 'number',
      'phonenumber', 'phone no', 'phoneno', 'tel', 'cell phone', 'cellphone',
      'contact number', 'contactnumber', 'cell no', 'cellno', 'mobile number', 'mobilenumber'
    ];
    
    // Default column settings
    let nameIdx = -1;
    let phoneIdx = -1;
    let startRow = 1; // Default to assuming first row is headers
    
    // Check if first row looks like headers
    const firstRow = sheetData[0];
    let hasHeaderNames = false;
    
    if (firstRow) {
      hasHeaderNames = Object.entries(firstRow).some(([_, value]) => {
        const strValue = String(value || '').toLowerCase();
        return possibleNameHeaders.some(h => strValue.includes(h)) || 
              possiblePhoneHeaders.some(h => strValue.includes(h));
      });
    }
    
    if (hasHeaderNames) {
      // Find name and phone columns from headers
      Object.entries(firstRow).forEach(([col, value]) => {
        const strValue = String(value || '').toLowerCase();
        
        if (nameIdx === -1 && possibleNameHeaders.some(h => strValue.includes(h))) {
          nameIdx = col.charCodeAt(0) - 65; // Convert A->0, B->1, etc.
        }
        
        if (phoneIdx === -1 && possiblePhoneHeaders.some(h => strValue.includes(h))) {
          phoneIdx = col.charCodeAt(0) - 65;
        }
      });
    } else {
      // No headers, analyze data patterns
      startRow = 0;
      
      // Sample rows for analysis
      const sampleSize = Math.min(5, sheetData.length);
      const columnData: Record<string, string[]> = {};
      
      // Collect sample values per column
      for (let i = 0; i < sampleSize; i++) {
        const row = sheetData[i];
        if (row) {
          Object.entries(row).forEach(([col, value]) => {
            if (!columnData[col]) columnData[col] = [];
            columnData[col].push(String(value || ''));
          });
        }
      }
      
      // Score columns by likelihood of being name vs phone
      const colProbabilities: Record<string, { nameProb: number, phoneProb: number }> = {};
      
      Object.entries(columnData).forEach(([col, values]) => {
        let nameProb = 0;
        let phoneProb = 0;
        
        values.forEach(val => {
          // Phone patterns
          const hasDigits = /\d/.test(val);
          const digitRatio = val.length > 0 ? (val.match(/\d/g) || []).length / val.length : 0;
          const hasPhoneFormatting = /[\-\(\)\+\s]/.test(val);
          
          // Name patterns
          const hasMultipleWords = val.split(/\s+/).filter(Boolean).length > 1;
          const hasLetters = /[a-zA-Z]/.test(val);
          const letterRatio = val.length > 0 ? (val.match(/[a-zA-Z]/g) || []).length / val.length : 0;
          
          // Scoring
          if (hasDigits) phoneProb += 1;
          if (digitRatio > 0.5) phoneProb += 2;
          if (hasPhoneFormatting) phoneProb += 1;
          
          if (hasMultipleWords) nameProb += 1; 
          if (hasLetters) nameProb += 1;
          if (letterRatio > 0.5) nameProb += 1;
          if (!hasDigits) nameProb += 1;
        });
        
        colProbabilities[col] = { nameProb, phoneProb };
      });
      
      // Select best columns
      let bestNameCol = '';
      let bestPhoneCol = '';
      let maxNameProb = -1;
      let maxPhoneProb = -1;
      
      Object.entries(colProbabilities).forEach(([col, { nameProb, phoneProb }]) => {
        if (nameProb > maxNameProb) {
          maxNameProb = nameProb;
          bestNameCol = col;
        }
        
        if (phoneProb > maxPhoneProb) {
          maxPhoneProb = phoneProb;
          bestPhoneCol = col;
        }
      });
      
      // Handle case where best name and phone are the same column
      if (bestNameCol === bestPhoneCol && Object.keys(colProbabilities).length > 1) {
        let secondBestPhoneCol = '';
        let secondMaxPhoneProb = -1;
        
        Object.entries(colProbabilities).forEach(([col, { phoneProb }]) => {
          if (col !== bestNameCol && phoneProb > secondMaxPhoneProb) {
            secondMaxPhoneProb = phoneProb;
            secondBestPhoneCol = col;
          }
        });
        
        if (secondBestPhoneCol) {
          bestPhoneCol = secondBestPhoneCol;
        }
      }
      
      // Convert column letters to indices
      if (bestNameCol) nameIdx = bestNameCol.charCodeAt(0) - 65;
      if (bestPhoneCol) phoneIdx = bestPhoneCol.charCodeAt(0) - 65;
    }
    
    // Default to first two columns if detection failed
    if (nameIdx === -1) nameIdx = 0;  // First column (A)
    if (phoneIdx === -1) phoneIdx = 1;  // Second column (B)
    
    // Convert indices back to Excel column letters
    const nameColLetter = String.fromCharCode(nameIdx + 65);
    const phoneColLetter = String.fromCharCode(phoneIdx + 65);
    
    console.log(`Using column ${nameColLetter} for names and ${phoneColLetter} for phone numbers`);
    
    // Extract contacts from data
    for (let i = startRow; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (!row) continue;
      
      const name = String(row[nameColLetter] || '').trim();
      const phoneNumber = String(row[phoneColLetter] || '').trim();
      
      // Skip empty data
      if (!name || !phoneNumber) continue;
      
      // Skip header-like rows or invalid phone numbers
      const isLikelyHeader = 
        name.toLowerCase().includes('name') || 
        phoneNumber.toLowerCase().includes('phone') ||
        name.toLowerCase().includes('project') ||
        phoneNumber.toLowerCase().includes('date') ||
        /^(amount|date|total|sum|price|cost)/i.test(name) ||
        /^(amount|date|total|sum|price|cost)/i.test(phoneNumber);
      
      // Ensure phone has digits
      const hasDigits = /\d/.test(phoneNumber);
      
      if (isLikelyHeader || !hasDigits) continue;
      
      try {
        const contactData = {
          id: contacts.length + 1,
          name,
          phoneNumber
        };
        
        // Validate and add contact
        const contact = contactSchema.parse(contactData);
        contacts.push(contact);
      } catch (error) {
        console.warn(`Skipping invalid contact at row ${i+1}: ${name}, ${phoneNumber}`);
      }
    }
    
    // Ensure contacts were found
    if (contacts.length === 0) {
      throw new Error('No contacts found in the file. Make sure the file has Name and Phone Number columns.');
    }
    
    console.log(`Successfully extracted ${contacts.length} contacts`);
    return contacts;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to parse Excel file');
  }
}
