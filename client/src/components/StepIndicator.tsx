interface StepIndicatorProps {
  currentView: "upload" | "processing" | "download" | "error";
}

export default function StepIndicator({ currentView }: StepIndicatorProps) {
  const isProcessActive = currentView === "processing" || currentView === "download";
  const isDownloadActive = currentView === "download";

  return (
    <div className="flex justify-between items-center mb-8 px-2">
      <div className="flex items-center">
        <div className="rounded-full h-8 w-8 flex items-center justify-center bg-primary text-primary-foreground">
          1
        </div>
        <div className="ml-2 text-sm font-medium">Upload</div>
      </div>
      <div className="h-1 w-16 bg-gray-200 sm:w-24" />
      <div className="flex items-center">
        <div 
          className={`rounded-full h-8 w-8 flex items-center justify-center ${
            isProcessActive 
              ? "bg-primary text-primary-foreground" 
              : "bg-gray-200 text-gray-600"
          }`}
        >
          2
        </div>
        <div className={`ml-2 text-sm font-medium ${
          isProcessActive ? "" : "text-gray-400"
        }`}>
          Process
        </div>
      </div>
      <div className="h-1 w-16 bg-gray-200 sm:w-24" />
      <div className="flex items-center">
        <div 
          className={`rounded-full h-8 w-8 flex items-center justify-center ${
            isDownloadActive 
              ? "bg-primary text-primary-foreground" 
              : "bg-gray-200 text-gray-600"
          }`}
        >
          3
        </div>
        <div className={`ml-2 text-sm font-medium ${
          isDownloadActive ? "" : "text-gray-400"
        }`}>
          Download
        </div>
      </div>
    </div>
  );
}
