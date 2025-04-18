"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  UserCheck,
  UserX,
  Wallet,
  LogIn
} from "lucide-react";
import { SessionData } from "@/lib/session";
import {
  getObituaryDetails,
  ObituaryDetails
} from "@/lib/actions/public-search/get-obituary-details";
import { Badge } from "@/components/ui/badge";

type RequestStep = "authCheck" | "loadingDetails" | "infoDisplay" | "error";

interface RequestObituaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionData | null;
  obituaryRef: string | null;
  obituaryName: string | null; // To display the name
  onSignInRequest: () => void; // Function to trigger opening the login dialog
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

  // Fetch details when the dialog opens or when auth status is confirmed
  useEffect(() => {
    if (isOpen && obituaryRef && step === "authCheck") {
      // If logged in, proceed directly to fetch details
      if (session?.isLoggedIn) {
        setIsGuestFlow(false);
        fetchDetails(obituaryRef);
      } else {
        // Stay on authCheck step for non-logged-in users
        setIsGuestFlow(false); // Reset guest flow flag
      }
    }

    // Reset state when dialog closes
    if (!isOpen) {
      setStep("authCheck");
      setDetails(null);
      setError(null);
      setIsGuestFlow(false);
    }
  }, [isOpen, obituaryRef, session?.isLoggedIn, step]); // Add step dependency

  const fetchDetails = async (ref: string) => {
    setStep("loadingDetails");
    setError(null);
    try {
      const result = await getObituaryDetails(ref);
      if (result.error) {
        setError(result.error);
        setStep("error");
      } else if (result.data) {
        setDetails(result.data);
        setStep("infoDisplay");
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
    fetchDetails(obituaryRef); // Fetch details for guest
  };

  const handleDownload = () => {
    // TODO: Implement actual download logic
    // This might involve another server action to get a signed URL
    // For now, just log it
    console.log("Download requested for:", details?.reference);
    alert("Download functionality not yet implemented.");
    onOpenChange(false); // Close dialog after action
  };

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
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "Could not load details."}
            </AlertDescription>
          </Alert>
        );

      case "infoDisplay":
        if (!details) {
          // Should not happen if step is infoDisplay, but acts as a fallback
          setError("Could not load details.");
          setStep("error");
          return null;
        }
        const isLoggedIn = session?.isLoggedIn && !isGuestFlow; // Ensure guest flow doesn't override logged in status display

        return (
          <div className="space-y-4">
            {isLoggedIn ? (
              <Badge
                variant="outline"
                className="border-green-600 text-green-700"
              >
                <UserCheck className="mr-1 h-3 w-3" /> Member Access
              </Badge>
            ) : (
              <Badge variant="secondary">
                <UserX className="mr-1 h-3 w-3" /> Guest Access
              </Badge>
            )}

            <p className="text-sm text-muted-foreground">
              Details for obituary record:{" "}
              <span className="font-medium text-foreground">
                {obituaryName ?? details.reference}
              </span>
            </p>
            {details.hasImages ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">
                  Image Record Available
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  {isLoggedIn
                    ? `This obituary has ${details.imageCount} image record(s) available for download.`
                    : `This obituary has ${details.imageCount} image record(s). As a non-member, access costs $10 CAD + fees.`}
                </AlertDescription>
              </Alert>
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

            <DialogFooter className="pt-4">
              {isLoggedIn && details.hasImages && (
                <Button onClick={handleDownload} className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Download Image(s)
                </Button>
              )}
              {!isLoggedIn && details.hasImages && (
                <Button disabled className="w-full">
                  <Wallet className="mr-2 h-4 w-4" /> Proceed to Payment (Coming
                  Soon)
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        );

      case "authCheck": // Initial step for non-logged-in users
      default:
        return (
          <div className="space-y-4">
            <p>
              To download available obituary images for free, please sign in
              with your KDGS membership credentials.
            </p>
            <p className="text-sm text-muted-foreground">
              Alternatively, you can proceed as a guest. Image records for
              guests cost $10 CAD plus processing fees (payment processing
              coming soon).
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
          {step !== "authCheck" && step !== "loadingDetails" && (
            <DialogDescription>
              {obituaryName ?? obituaryRef ?? ""}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="py-4">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
