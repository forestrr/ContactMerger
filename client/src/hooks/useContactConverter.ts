import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ContactConverterOptions {
  onSuccess?: (data: { contactCount: number; vcfData: string }) => void;
  onError?: (error: Error) => void;
}

export default function useContactConverter(options?: ContactConverterOptions) {
  const [progress, setProgress] = useState(0);
  const [vcfData, setVcfData] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      try {
        const response = await fetch("/api/convert", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        clearInterval(progressInterval);
        setProgress(100);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to convert file");
        }

        const result = await response.json();
        setVcfData(result.vcfData);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  const convertExcelToVcf = async (file: File) => {
    setProgress(0);
    return uploadMutation.mutateAsync(file);
  };

  const downloadVcfFile = (filename: string) => {
    if (!vcfData) return;

    const blob = new Blob([vcfData], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    convertExcelToVcf,
    isConverting: uploadMutation.isPending,
    progress,
    error: uploadMutation.error,
    downloadVcfFile,
  };
}
