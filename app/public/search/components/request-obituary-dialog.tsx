"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  UserCheck,
  UserX,
  Wallet,
  LogIn,
  FileWarning,
  FileText
} from "lucide-react";
import type { SessionData } from "@/lib/session";
import {
  getObituaryDetails,
  ObituaryDetails
} from "@/lib/actions/public-search/get-obituary-details";
import { getObituaryImageUrls } from "@/lib/actions/public-search/get-obituary-image-urls";

type RequestStep = "authCheck" | "loadingDetails" | "infoDisplay" | "error";

interface RequestObituaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionData | null;
  obituaryRef: string | null;
  obituaryName: string | null;
  onSignInRequest: () => void;
}

export function RequestObituaryDialog({
  isOpen,
  onOpenChange,
  session,
  obituaryRef,
  obituaryName,
  onSignInRequest
}: RequestObituaryDialogProps) {
  const [step, setStep] = useState<RequestStep>("authCheck");
  const [details, setDetails] = useState<ObituaryDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGuestFlow, setIsGuestFlow] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && obituaryRef) {
      if (session?.isLoggedIn) {
        setIsGuestFlow(false);
        fetchDetails(obituaryRef);
      } else {
        setStep("authCheck");
        setIsGuestFlow(false);
      }
    } else {
      setStep("authCheck");
      setDetails(null);
      setError(null);
      setIsGuestFlow(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, obituaryRef, session?.isLoggedIn]);

  const fetchDetails = async (ref: string) => {
    setStep("loadingDetails");
    setError(null);
    setDetails(null);
    try {
      const result = await getObituaryDetails(ref);
      if (result.error) {
        setError(result.error);
        setStep("error");
      } else if (result.data) {
        setDetails(result.data);
        setStep("infoDisplay");
      } else {
        setError("Failed to retrieve details.");
        setStep("error");
      }
    } catch (err) {
      console.error("Fetch details error:", err);
      setError("An unexpected error occurred fetching details.");
      setStep("error");
    }
  };

  const handleProceedAsGuest = () => {
    if (!obituaryRef) return;
    setIsGuestFlow(true);
    fetchDetails(obituaryRef);
  };

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
    if (!details?.reference || !session?.isLoggedIn) {
      setDownloadError(
        "Cannot initiate download. Missing data or not logged in."
      );
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    const reference = details.reference;
    let pdfSuccess = false;
    let imagesSuccess = false;
    let errorMessages: string[] = [];

    try {
      try {
        await triggerPdfDownload(reference);
        pdfSuccess = true;
      } catch (pdfError) {
        if (pdfError instanceof Error) {
          errorMessages.push(pdfError.message);
        } else {
          errorMessages.push("An unknown error occurred downloading the PDF.");
        }
      }

      if (details.imageCount > 0) {
        const result = await getObituaryImageUrls(reference);

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

  if (!isOpen || !obituaryRef) {
    return null;
  }

  const renderContent = () => {
    switch (step) {
      case "loadingDetails":
        return (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[#003B5C]" />
            <p className="ml-4 text-gray-600">Loading obituary details...</p>
          </div>
        );

      case "error":
        return (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Details</AlertTitle>
              <AlertDescription>
                {error || "Could not load obituary details."}
              </AlertDescription>
            </Alert>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        );

      case "infoDisplay":
        if (!details) {
          setError("Obituary details are missing.");
          setStep("error");
          return null;
        }
        const isLoggedIn = session?.isLoggedIn && !isGuestFlow;

        return (
          <div className="space-y-4">
            {isLoggedIn ? (
              <Badge
                variant="outline"
                className="border-green-600 text-green-700 bg-green-50"
              >
                <UserCheck className="mr-1 h-3 w-3" /> Member Access
              </Badge>
            ) : (
              <Badge variant="secondary">
                <UserX className="mr-1 h-3 w-3" /> Guest Access
              </Badge>
            )}

            {details.hasImages ? (
              <>
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">
                    Image Record Available
                  </AlertTitle>
                  <AlertDescription className="text-green-700">
                    {isLoggedIn
                      ? `This obituary has ${details.imageCount} image record(s) available for download.`
                      : `This obituary has ${details.imageCount} image record(s). As a guest, access costs $10 CAD + fees.`}
                  </AlertDescription>
                </Alert>
                <Alert className="bg-blue-50 border-blue-200">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">
                    PDF Report Included
                  </AlertTitle>
                  <AlertDescription className="text-blue-700">
                    {isLoggedIn
                      ? "A PDF report containing the obituary details is also included with your image download."
                      : "A PDF report containing the obituary details is included at no extra cost when you purchase access to the image record(s)."}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Alert className="bg-yellow-50 border-yellow-200">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">
                  No Image Record Found
                </AlertTitle>
                <AlertDescription className="text-yellow-700">
                  We do not currently have a digitized image associated with
                  this obituary record.
                </AlertDescription>
              </Alert>
            )}

            {downloadError && (
              <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>Download Issue</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">
                  {downloadError}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="pt-4 sm:justify-start flex-col sm:flex-row sm:gap-2">
              {isLoggedIn && details.hasImages && (
                <Button onClick={handleDownload} disabled={isDownloading}>
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" /> Download Report &
                      Image(s)
                    </>
                  )}
                </Button>
              )}
              {!isLoggedIn && details.hasImages && (
                <Button disabled className="w-full sm:w-auto">
                  <Wallet className="mr-2 h-4 w-4" /> Proceed to Payment (Soon)
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="outline" disabled={isDownloading}>
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        );

      case "authCheck":
      default:
        return (
          <div className="space-y-4">
            <p>
              To download available obituary images and PDF reports for free,
              please sign in with your KDGS membership credentials.
            </p>
            <p className="text-sm text-muted-foreground">
              Alternatively, you can proceed as a guest. Image records for
              guests may require payment (details shown on the next step).
            </p>
            <DialogFooter className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button onClick={onSignInRequest} className="w-full">
                <LogIn className="mr-2 h-4 w-4" /> Member Sign In
              </Button>
              <Button
                variant="secondary"
                onClick={handleProceedAsGuest}
                className="w-full"
              >
                Proceed as Guest
              </Button>
            </DialogFooter>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Obituary Record</DialogTitle>
          <DialogDescription>
            {step === "infoDisplay" || step === "error"
              ? (obituaryName ?? obituaryRef)
              : "Authentication Check"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[150px]">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
