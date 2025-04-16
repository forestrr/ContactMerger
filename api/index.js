// Serverless function entry point for Vercel
import express from 'express';
import multer from 'multer';
import { excelToContacts } from '../server/services/excelParser.js';
import { generateVcf } from '../server/services/vcfGenerator.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

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

export default app;