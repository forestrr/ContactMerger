import { Progress } from "@/components/ui/progress";
import { Info } from "lucide-react";

interface ProcessingViewProps {
  fileName: string;
  fileSize: number;
  progress: number;
  contactCount: number;
  onCancel: () => void;
}

export default function ProcessingView({ 
  fileName, 
  fileSize, 
  progress, 
  contactCount,
  onCancel 
}: ProcessingViewProps) {
  // Format file size for display
  const formattedFileSize = fileSize < 1024 * 1024
    ? `${Math.round(fileSize / 1024)}KB`
    : `${(fileSize / (1024 * 1024)).toFixed(2)}MB`;

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-xl font-medium mb-3">Processing your contacts</h2>
        <p className="text-muted-foreground">
          Please wait while we convert your Excel file to VCF format
        </p>
      </div>

      <div className="mb-6">
        <Progress value={progress} className="h-2 mb-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{progress < 100 ? "Processing contacts..." : "Conversion complete!"}</span>
          <span>{progress}%</span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-gray-500 mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              File: {fileName} ({formattedFileSize})
            </p>
            <p className="text-sm text-muted-foreground">
              Contacts found: <span className="font-medium">{contactCount}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button 
          className="text-gray-600 hover:text-gray-800 text-sm font-medium focus:outline-none"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
