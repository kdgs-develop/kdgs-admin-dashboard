"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Loader2, FileWarning } from "lucide-react";

interface DownloadButtonProps {
  obituaryRef: string;
}

export function DownloadButton({ obituaryRef }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownload = async () => {
    console.log(
      "NEW DOWNLOAD LOGIC TRIGGERED for ref:",
      obituaryRef,
      "at",
      new Date().toISOString()
    );
    if (!obituaryRef) {
      setDownloadError("Cannot initiate download. Missing obituary reference.");
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const cacheBuster = `cb=${new Date().getTime()}`;
      const downloadUrl = `/api/download-all-files/${encodeURIComponent(obituaryRef)}?${cacheBuster}`;
      console.log(
        "Attempting to download from URL (PaymentSuccess):",
        downloadUrl
      );

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `obituary_files_${obituaryRef}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(
        "Download process error in NEW logic (PaymentSuccess):",
        err
      );
      setDownloadError(
        `An unexpected error occurred. If the problem persists, please contact support. ${err instanceof Error ? err.message : ""}`.trim()
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {downloadError && (
        <Alert variant="destructive">
          <FileWarning className="h-4 w-4" />
          <AlertTitle>Download Issue</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {downloadError}
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full sm:w-auto"
      >
        {isDownloading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating &
            Downloading...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" /> Download Report & Image(s)
          </>
        )}
      </Button>
    </div>
  );
}
