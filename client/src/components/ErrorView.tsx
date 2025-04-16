import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorViewProps {
  errorMessage: string;
  onStartOver: () => void;
}

export default function ErrorView({ errorMessage, onStartOver }: ErrorViewProps) {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-error" />
        </div>
        <h2 className="text-xl font-medium mb-2">Conversion Failed</h2>
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>

      <div className="bg-red-50 p-4 rounded-md mb-6">
        <h3 className="font-medium text-red-800 mb-2">Possible solutions:</h3>
        <ul className="text-sm text-red-700 pl-5 space-y-1 list-disc">
          <li>Make sure your file is in .xlsx or .xls format</li>
          <li>Check that your file contains "Name" and "Phone Number" columns</li>
          <li>Ensure the file size is under 5MB</li>
          <li>Try downloading our sample template and copy your data into it</li>
        </ul>
      </div>

      <div className="flex justify-center">
        <Button onClick={onStartOver}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
