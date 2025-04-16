import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { excelToContacts } from "./services/excelParser";
import { generateVcf } from "./services/vcfGenerator";
import { Contact, converterResponseSchema } from "@shared/schema";
import fs from "fs";
import { ZodError } from "zod";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    const allowedMimes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
    ];
    
    const allowedExtensions = [".xlsx", ".xls"];
    const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));
    
    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Please upload a valid Excel file (.xlsx or .xls)"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint for converting Excel to VCF
  app.post("/api/convert", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse the Excel file to extract contacts
      const contacts = await excelToContacts(req.file.buffer);
      
      if (contacts.length === 0) {
        return res.status(400).json({ 
          message: "No contacts found in the file. Make sure the file has Name and Phone Number columns." 
        });
      }

      // Generate VCF data from contacts
      const vcfData = generateVcf(contacts);
      
      // Create response object
      const response = {
        contactCount: contacts.length,
        vcfData: vcfData,
      };
      
      // Validate the response
      const validated = converterResponseSchema.parse(response);
      
      // Return the response
      res.status(200).json(validated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid data format", details: error.errors });
      }
      
      console.error("Error converting file:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to convert file" 
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
