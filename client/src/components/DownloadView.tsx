import { Button } from "@/components/ui/button";
import { Check, Download } from "lucide-react";

interface DownloadViewProps {
  fileName: string;
  contactCount: number;
  onDownload: () => void;
  onStartOver: () => void;
}

export default function DownloadView({ 
  fileName, 
  contactCount, 
  onDownload, 
  onStartOver 
}: DownloadViewProps) {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-medium mb-2">Conversion Complete!</h2>
        <p className="text-muted-foreground mb-1">
          {contactCount} contacts have been successfully converted
        </p>
        <p className="text-sm text-gray-500">Original file: {fileName}</p>
      </div>

      <div className="flex justify-center mb-6">
        <Button 
          className="flex items-center px-6 py-3"
          onClick={onDownload}
        >
          <Download className="h-5 w-5 mr-2" />
          Download VCF File
        </Button>
      </div>

      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h3 className="font-medium text-gray-700 mb-2">What's next?</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Import the VCF file to your phone contacts by:
        </p>
        <ul className="text-sm text-muted-foreground pl-5 space-y-1 list-disc">
          <li>Send the VCF file to your phone via email</li>
          <li>Open the file on your phone to import all contacts at once</li>
          <li>For iPhone users: Go to Settings &gt; Contacts &gt; Import VCF</li>
          <li>For Android users: Open Contacts app &gt; Settings &gt; Import</li>
        </ul>
      </div>

      <div className="text-center">
        <button 
          className="text-primary text-sm font-medium hover:underline focus:outline-none"
          onClick={onStartOver}
        >
          Convert another Excel file
        </button>
      </div>
    </div>
  );
}
