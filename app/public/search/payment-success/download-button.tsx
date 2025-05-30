"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Loader2, FileWarning } from "lucide-react";
import { getObituaryImageUrls } from "@/lib/actions/public-search/get-obituary-image-urls";

interface DownloadButtonProps {
  obituaryRef: string;
}

export function DownloadButton({ obituaryRef }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const triggerImageDownloads = (filenames: string[]) => {
    filenames.forEach((filename, index) => {
      setTimeout(() => {
        try {
          const link = document.createElement("a");
          link.href = `/api/download-image/${encodeURIComponent(filename)}`;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (error) {
          console.error(
            "Error triggering image download for:",
            filename,
            error
          );
        }
      }, index * 700);
    });
  };

  const triggerPdfDownload = async (reference: string) => {
    try {
      const pdfResponse = await fetch(
        `/api/generate-pdf/${encodeURIComponent(reference)}`
      );
      if (!pdfResponse.ok) {
        const errorBody = await pdfResponse.text();
        throw new Error(
          `Failed to generate PDF: ${pdfResponse.statusText} ${errorBody}`.trim()
        );
      }
      const pdfBlob = await pdfResponse.blob();
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement("a");
      pdfLink.href = pdfUrl;
      pdfLink.download = `obituary_report_${reference}.pdf`;
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      window.URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      throw new Error(
        `Failed to download PDF report. ${error instanceof Error ? error.message : ""}`.trim()
      );
    }
  };

  const handleDownload = async () => {
    if (!obituaryRef) {
      setDownloadError("Cannot initiate download. Missing obituary reference.");
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    let pdfSuccess = false;
    let imagesSuccess = false;
    let errorMessages: string[] = [];

    try {
      try {
        await triggerPdfDownload(obituaryRef);
        pdfSuccess = true;
      } catch (pdfError) {
        if (pdfError instanceof Error) {
          errorMessages.push(pdfError.message);
        } else {
          errorMessages.push("An unknown error occurred downloading the PDF.");
        }
      }

      const result = await getObituaryImageUrls(obituaryRef);

      if (result.error) {
        errorMessages.push(result.error);
      } else if (result.message && !result.imageNames) {
        errorMessages.push(result.message);
      } else if (result.imageNames && result.imageNames.length > 0) {
        triggerImageDownloads(result.imageNames);
        imagesSuccess = true;
      } else {
        errorMessages.push(
          "Could not find image files to download, although expected."
        );
      }

      if (errorMessages.length > 0) {
        setDownloadError(errorMessages.join(" \n "));
      }
    } catch (err) {
      console.error("Download process error:", err);
      setDownloadError(
        `An unexpected error occurred during the download process. ${errorMessages.join(" \n ")}`.trim()
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
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
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
