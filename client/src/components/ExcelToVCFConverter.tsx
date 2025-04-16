import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import UploadView from "@/components/UploadView";
import ProcessingView from "@/components/ProcessingView";
import DownloadView from "@/components/DownloadView";
import ErrorView from "@/components/ErrorView";
import { useToast } from "@/hooks/use-toast";
import useContactConverter from "@/hooks/useContactConverter";

type View = "upload" | "processing" | "download" | "error";

export default function ExcelToVCFConverter() {
  const [currentView, setCurrentView] = useState<View>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [contactCount, setContactCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { toast } = useToast();
  
  const { convertExcelToVcf, isConverting, progress, downloadVcfFile } = useContactConverter({
    onSuccess: (data) => {
      setContactCount(data.contactCount);
      setCurrentView("download");
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setCurrentView("error");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    setCurrentView("processing");
    
    try {
      await convertExcelToVcf(file);
    } catch (error) {
      // Error handling is done via the onError callback
    }
  };

  const handleDownload = () => {
    downloadVcfFile(fileName.replace(/\.(xlsx|xls)$/i, ".vcf"));
  };

  const handleCancel = () => {
    setCurrentView("upload");
  };

  const handleStartOver = () => {
    setCurrentView("upload");
    setFileName("");
    setFileSize(0);
    setContactCount(0);
    setErrorMessage("");
  };

  return (
    <>
      <StepIndicator currentView={currentView} />
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {currentView === "upload" && (
          <UploadView onFileUpload={handleFileUpload} />
        )}
        
        {currentView === "processing" && (
          <ProcessingView 
            fileName={fileName}
            fileSize={fileSize}
            progress={progress}
            contactCount={contactCount}
            onCancel={handleCancel}
          />
        )}
        
        {currentView === "download" && (
          <DownloadView
            fileName={fileName}
            contactCount={contactCount}
            onDownload={handleDownload}
            onStartOver={handleStartOver}
          />
        )}
        
        {currentView === "error" && (
          <ErrorView 
            errorMessage={errorMessage}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </>
  );
}
