import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileType } from "lucide-react";

interface UploadViewProps {
  onFileUpload: (file: File) => void;
}

export default function UploadView({ onFileUpload }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file extension
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please upload a valid Excel file (.xlsx or .xls)",
      });
      return false;
    }
    
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File size exceeds 5MB limit",
      });
      return false;
    }
    
    return true;
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  };
  
  const handleBrowseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileUpload(file);
      }
    }
  };

  const handleDownloadSample = () => {
    // Create a simple Excel template
    const sampleData = [
      ["Name", "Phone Number"],
      ["John Doe", "1234567890"],
      ["Jane Smith", "9876543210"]
    ];
    
    // Convert to CSV for simplicity
    const csvContent = sampleData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contact_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Sample template has been downloaded",
    });
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium mb-2">Upload your Excel file</h2>
        <p className="text-muted-foreground text-sm mb-4">
          File should contain columns for names and phone numbers
        </p>
      </div>

      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-blue-50" : "border-gray-300 hover:border-primary"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleFileDrop}
        onClick={handleBrowseFiles}
      >
        <div className="flex flex-col items-center">
          <Upload className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-base mb-1">Drag and drop your Excel file here</p>
          <p className="text-sm text-gray-500 mb-3">or</p>
          <Button>Browse Files</Button>
          <input 
            type="file" 
            id="file-input" 
            className="hidden" 
            accept=".xlsx,.xls" 
            onChange={handleFileSelection} 
            ref={fileInputRef}
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md mb-4">
        <h3 className="font-medium text-blue-800 mb-2">Excel File Requirements:</h3>
        <ul className="text-sm text-blue-700 pl-5 space-y-1 list-disc">
          <li>File format: .xlsx or .xls</li>
          <li>Maximum file size: 5MB</li>
          <li>Must contain columns for "Name" and "Phone Number"</li>
          <li>First row should be header row</li>
        </ul>
      </div>

      <div className="text-center">
        <button 
          className="text-primary text-sm font-medium hover:underline focus:outline-none"
          onClick={handleDownloadSample}
        >
          Download sample Excel template
        </button>
      </div>
    </div>
  );
}
