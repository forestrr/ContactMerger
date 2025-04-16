// Serverless function entry point for Vercel
import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';

// Create Express app
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Helper functions from original services, inlined for Vercel serverless
async function excelToContacts(buffer) {
  try {
    // Try different read options for better compatibility
    let workbook;
    
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
      
      // If that fails, try with different options
      try {
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
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in the Excel file');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON with header option
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: "A",
      blankrows: false,
      defval: ""
    });
    
    if (jsonData.length <= 1) { // Accounting for header row
      throw new Error('The Excel file is empty or contains only headers');
    }
    
    // Extract contacts
    const contacts = [];
    
    // Define a wider range of possible header names
    const possibleNameHeaders = [
      'name', 'full name', 'contact name', 'contact', 'person', 'fullname', 
      'contactname', 'first name', 'firstname', 'last name', 'lastname', 'user'
    ];
    
    const possiblePhoneHeaders = [
      'phone', 'phone number', 'telephone', 'mobile', 'cell', 'number',
      'phonenumber', 'phone no', 'phoneno', 'tel', 'cell phone', 'cellphone',
      'contact number', 'contactnumber', 'cell no', 'cellno', 'mobile number', 'mobilenumber'
    ];
    
    // Handle case where the first row might be headers
    let nameIdx = -1;
    let phoneIdx = -1;
    let startRow = 1; // Default to assuming first row is headers
    
    // First, try treating first row as headers
    const firstRow = jsonData[0];
    
    // Check if it has header-like names
    const hasHeaderNames = Object.entries(firstRow || {}).some(([_, value]) => {
      const strValue = String(value || '').toLowerCase();
      return possibleNameHeaders.some(h => strValue.includes(h)) || 
             possiblePhoneHeaders.some(h => strValue.includes(h));
    });
    
    if (hasHeaderNames) {
      // Try to find name and phone columns from headers
      Object.entries(firstRow || {}).forEach(([col, value]) => {
        const strValue = String(value || '').toLowerCase();
        
        if (nameIdx === -1 && possibleNameHeaders.some(h => strValue.includes(h))) {
          nameIdx = col.charCodeAt(0) - 65; // Convert A->0, B->1, etc.
        }
        
        if (phoneIdx === -1 && possiblePhoneHeaders.some(h => strValue.includes(h))) {
          phoneIdx = col.charCodeAt(0) - 65;
        }
      });
    } else {
      // Treat the first row as data, not headers
      startRow = 0;
      
      // Look at several rows to detect which columns are likely name vs phone
      const sampleSize = Math.min(5, jsonData.length);
      const columnData = {};
      
      // Collect sample data for each column
      for (let i = 0; i < sampleSize; i++) {
        const row = jsonData[i];
        Object.entries(row || {}).forEach(([col, value]) => {
          if (!columnData[col]) columnData[col] = [];
          columnData[col].push(String(value || ''));
        });
      }
      
      // Analyze column content to guess which is name and which is phone
      const colProbabilities = {};
      
      Object.entries(columnData).forEach(([col, values]) => {
        let nameProb = 0;
        let phoneProb = 0;
        
        values.forEach(val => {
          // Phone number patterns (more digits, special characters like +, -, spaces)
          const hasDigits = /\d/.test(val);
          const digitRatio = (val.match(/\d/g) || []).length / val.length;
          const hasPhoneFormatting = /[\-\(\)\+\s]/.test(val);
          
          // Name patterns (words, spaces, no digits)
          const hasMultipleWords = val.split(/\s+/).filter(Boolean).length > 1;
          const hasLetters = /[a-zA-Z]/.test(val);
          const letterRatio = (val.match(/[a-zA-Z]/g) || []).length / val.length;
          
          // Weight factors for phone probability
          if (hasDigits) phoneProb += 1;
          if (digitRatio > 0.5) phoneProb += 2;
          if (hasPhoneFormatting) phoneProb += 1;
          
          // Weight factors for name probability
          if (hasMultipleWords) nameProb += 1; 
          if (hasLetters) nameProb += 1;
          if (letterRatio > 0.5) nameProb += 1;
          if (!hasDigits) nameProb += 1;
        });
        
        colProbabilities[col] = { nameProb, phoneProb };
      });
      
      // Find the most likely columns
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
      
      // If best name and phone are the same, pick the second best for one of them
      if (bestNameCol === bestPhoneCol && Object.keys(colProbabilities).length > 1) {
        // Find the second best phone column
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
      
      if (bestNameCol) nameIdx = bestNameCol.charCodeAt(0) - 65;
      if (bestPhoneCol) phoneIdx = bestPhoneCol.charCodeAt(0) - 65;
    }
    
    // If we still couldn't identify columns, use first and second columns as fallback
    if (nameIdx === -1) nameIdx = 0;  // First column (A)
    if (phoneIdx === -1) phoneIdx = 1;  // Second column (B)
    
    // Convert column indices back to Excel column letters
    const nameColLetter = String.fromCharCode(nameIdx + 65);
    const phoneColLetter = String.fromCharCode(phoneIdx + 65);
    
    console.log(`Using column ${nameColLetter} for names and ${phoneColLetter} for phone numbers`);
    
    // Process rows to extract contacts
    for (let i = startRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      const name = String(row[nameColLetter] || '').trim();
      const phoneNumber = String(row[phoneColLetter] || '').trim();
      
      // Skip empty rows or rows without required data
      if (!name || !phoneNumber) continue;
      
      // Skip if it looks like a header row
      const isLikelyHeader = name.toLowerCase().includes('name') || 
                          phoneNumber.toLowerCase().includes('phone');
      if (isLikelyHeader) continue;
      
      // Create a contact with ID
      contacts.push({
        id: contacts.length + 1,
        name,
        phoneNumber
      });
    }
    
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

function generateVcf(contacts) {
  let vcfContent = '';
  
  for (const contact of contacts) {
    // Basic VCF format (version 3.0)
    vcfContent += 'BEGIN:VCARD\n';
    vcfContent += 'VERSION:3.0\n';
    vcfContent += `FN:${contact.name}\n`;
    
    // Split name into parts (first/last) if possible
    const nameParts = contact.name.trim().split(/\s+/);
    if (nameParts.length > 1) {
      const lastName = nameParts.pop();
      const firstName = nameParts.join(' ');
      vcfContent += `N:${lastName};${firstName};;;\n`;
    } else {
      vcfContent += `N:${contact.name};;;;\n`;
    }
    
    // Format phone number - remove any non-digit except + at the beginning
    let phoneNumber = contact.phoneNumber.trim();
    
    // Add TEL property
    vcfContent += `TEL;TYPE=CELL:${phoneNumber}\n`;
    
    // End of card
    vcfContent += 'END:VCARD\n';
  }
  
  return vcfContent;
}

// Convert Excel to VCF
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the Excel file
    const contacts = await excelToContacts(req.file.buffer);
    
    if (contacts.length === 0) {
      return res.status(400).json({ 
        error: 'No valid contacts found in the Excel file. Please check the format.' 
      });
    }

    // Generate VCF data
    const vcfData = generateVcf(contacts);
    
    // Return the result
    return res.json({ 
      contactCount: contacts.length,
      vcfData 
    });
  } catch (error) {
    console.error('Error converting Excel to VCF:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Handle all other routes
app.all('*', (req, res) => {
  return res.status(404).json({ error: 'Route not found' });
});

// Export for Vercel
export default function handler(req, res) {
  return app(req, res);
}