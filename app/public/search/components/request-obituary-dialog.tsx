"use client";

import { useState, useEffect, useTransition } from "react";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  UserCheck,
  UserX,
  LogIn,
  FileWarning,
  FileText,
  ShoppingCart,
  Send,
  CheckCircle
} from "lucide-react";
import type { SessionData } from "@/lib/session";
import {
  getObituaryDetails,
  ObituaryDetails
} from "@/lib/actions/public-search/get-obituary-details";
import {
  sendObituaryRequestEmail,
  type ObituaryRequestFormData
} from "@/lib/actions/public-search/send-obituary-request-email";
import { recordMemberDownload } from "@/lib/actions/orders/record-member-download";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { POPULAR_COUNTRIES, ALL_COUNTRIES } from "@/constants";

type RequestStep =
  | "authCheck"
  | "loadingDetails"
  | "infoDisplay"
  | "requestForm"
  | "requestSuccess"
  | "error";

interface RequestObituaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  session: SessionData | null;
  obituaryRef: string | null;
  obituaryName: string | null;
  onSignInRequest: () => void;
  onAddToCart: (ref: string, name: string, hasImages: boolean) => void;
}

export function RequestObituaryDialog({
  isOpen,
  onOpenChange,
  session,
  obituaryRef,
  obituaryName,
  onSignInRequest,
  onAddToCart
}: RequestObituaryDialogProps) {
  const [step, setStep] = useState<RequestStep>("authCheck");
  const [details, setDetails] = useState<ObituaryDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGuestFlow, setIsGuestFlow] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  // Define the form schema
  const formSchema = z.object({
    requesterEmail: z.string().email("Please enter a valid email address"),
    requesterFullName: z.string().min(1, "Please enter your full name"),
    requesterCountry: z.string().min(1, "Please select your country"),
    requesterProvince: z.string().optional(),
    requesterPhoneNumber: z.string().optional(),
    requesterCity: z.string().optional(),
    notes: z.string().optional()
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requesterEmail: "",
      requesterFullName: "",
      requesterCountry: "",
      requesterProvince: "",
      requesterPhoneNumber: "",
      requesterCity: "",
      notes: ""
    }
  });

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep("authCheck");
        setDetails(null);
        setError(null);
        setIsGuestFlow(false);
        setIsDownloading(false);
        setDownloadError(null);
        form.reset();
      }, 300);
      return () => clearTimeout(timer);
    } else if (obituaryRef) {
      if (session?.isLoggedIn) {
        setIsGuestFlow(false);
        fetchDetails(obituaryRef);
      } else {
        setStep("authCheck");
        setIsGuestFlow(false);
        setError(null);
        setDetails(null);
        fetchDetails(obituaryRef, "authCheck", "authCheck");
      }
      setDownloadError(null);
      setIsDownloading(false);
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, obituaryRef, session?.isLoggedIn, form]);

  const fetchDetails = async (
    ref: string,
    nextStepOnSuccess: RequestStep = "infoDisplay",
    nextStepOnError: RequestStep = "error"
  ) => {
    setStep("loadingDetails");
    setError(null);
    setDetails(null);
    try {
      const result = await getObituaryDetails(ref);
      if (result.error) {
        setError(result.error);
        setStep(nextStepOnError);
      } else if (result.data) {
        setDetails(result.data);
        setStep(nextStepOnSuccess);
      } else {
        setError("Failed to retrieve details.");
        setStep(nextStepOnError);
      }
    } catch (err) {
      console.error("Fetch details error:", err);
      setError("An unexpected error occurred fetching details.");
      setStep(nextStepOnError);
    }
  };

  const handleProceedAsGuest = () => {
    if (!obituaryRef) return;
    setIsGuestFlow(true);
    fetchDetails(obituaryRef);
  };

  const handleAddToCartClick = () => {
    if (details?.reference && obituaryName && details !== null) {
      onAddToCart(details.reference, obituaryName, details.hasImages);
      onOpenChange(false);
    } else {
      console.error("Cannot add to cart, missing ref, name, or details");
      setDownloadError(
        "Could not add item to cart due to missing information."
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
    console.log(
      "NEW ZIP DOWNLOAD LOGIC TRIGGERED (RequestObituaryDialog) for ref:",
      reference,
      "at",
      new Date().toISOString()
    );

    try {
      const orderResult = await recordMemberDownload({
        obituaryRef: reference,
        obituaryName: obituaryName || reference,
        customerEmail: session.username,
        customerFullName: session.displayName || ""
      });

      if (!orderResult.success) {
        console.warn(
          "Failed to record download as order, but continuing zip download:",
          orderResult.error
        );
      }

      const cacheBuster = `cb=${new Date().getTime()}`;
      const downloadUrl = `/api/download-all-files/${encodeURIComponent(reference)}?${cacheBuster}`;
      console.log(
        "Attempting to download zip from URL (RequestObituaryDialog):",
        downloadUrl
      );

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `obituary_files_${reference}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Zip download process error (RequestObituaryDialog):", err);
      setDownloadError(
        `An unexpected error occurred during the download. ${err instanceof Error ? err.message : ""}`.trim()
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShowRequestForm = () => {
    setStep("requestForm");
  };

  const handleSendRequest = async (data: z.infer<typeof formSchema>) => {
    try {
      startTransition(async () => {
        if (!obituaryRef) {
          setError("Missing obituary reference");
          setStep("error");
          return;
        }

        // Construct requestData. Now that server action is updated, we can send new fields.
        const requestData: ObituaryRequestFormData = {
          obituaryRef: obituaryRef!,
          obituaryName: obituaryName || "",
          requesterEmail: data.requesterEmail,
          requesterFullName: data.requesterFullName,
          requesterCountry: data.requesterCountry,
          requesterProvince: data.requesterProvince || "",
          requesterPhoneNumber: data.requesterPhoneNumber || "",
          requesterCity: data.requesterCity || "",
          notes: data.notes || "",

          // --- Fields that were part of the old form, now sending defaults/placeholders ---
          // --- These are now optional on the server, so sending empty strings is fine. ---
          surname: "",
          givenNames: "",
          maidenName: "",
          alsoKnownAs: "",
          birthExactDate: "",
          birthYearRange: { from: "", to: "" },
          birthPlace: "",
          deathExactDate: "",
          deathYearRange: { from: "", to: "" },
          deathPlace: "",
          relatives: []
        };

        const result = await sendObituaryRequestEmail(requestData);

        if (result.success) {
          setStep("requestSuccess");
        } else {
          setError(result.error || "Failed to send request");
          setStep("error");
        }
      });
    } catch (error) {
      console.error("Send request error:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setStep("error");
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
                      : `This obituary has ${details.imageCount} image record(s). As a guest, access costs $10.00 CAD.`}
                  </AlertDescription>
                </Alert>
                <Alert className="bg-blue-50 border-blue-200">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">
                    PDF Report Included
                  </AlertTitle>
                  <AlertDescription className="text-blue-700">
                    {isLoggedIn
                      ? "A PDF report containing the obituary indexing details is also included with your image download."
                      : "A PDF report containing the obituary indexing details is included at no extra cost when you purchase access to the image record(s)."}
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
                  this obituary record. You can request our team to search for
                  it.
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
                <Button
                  onClick={handleAddToCartClick}
                  className="w-full sm:w-auto"
                  disabled={isDownloading}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                </Button>
              )}
              {!details.hasImages && (
                <Button onClick={handleShowRequestForm} variant="secondary">
                  <Send className="mr-2 h-4 w-4" /> Send Email Request
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

      case "requestForm":
        return (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Please provide your contact information below. Our team will use
              this to inform you when the image is ready for downloading or if
              we are unable to provide one for the following obituary:
            </p>
            <div className="mb-4 p-3 bg-slate-50 rounded-md border border-slate-200">
              <p className="text-sm font-medium text-slate-700">
                Deceased: <span className="font-normal">{obituaryName}</span>
              </p>
              <p className="text-sm font-medium text-slate-700">
                File Number: <span className="font-normal">{obituaryRef}</span>
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSendRequest)}
                className="space-y-4"
              >
                <div className="space-y-6 px-1">
                  <div className="space-y-4">
                    <h4 className="font-medium">Your Contact Information</h4>

                    <FormField
                      control={form.control}
                      name="requesterEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requesterFullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="requesterCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {POPULAR_COUNTRIES.map(country => (
                                  <SelectItem
                                    key={country.value}
                                    value={country.value}
                                  >
                                    {country.label}
                                  </SelectItem>
                                ))}

                                <SelectItem value="divider" disabled>
                                  ────────────────
                                </SelectItem>

                                {ALL_COUNTRIES.filter(
                                  country =>
                                    !POPULAR_COUNTRIES.some(
                                      popular => popular.value === country.value
                                    )
                                ).map(country => (
                                  <SelectItem
                                    key={country.value}
                                    value={country.value}
                                  >
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="requesterProvince"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province/State</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Province or State"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="requesterCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Your city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="requesterPhoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Optional: (555) 123-4567"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h4 className="font-medium">Additional Notes</h4>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any additional information that might help with the search"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep("infoDisplay")}
                    disabled={isSubmitting}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" /> Send Request
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        );

      case "requestSuccess":
        return (
          <div className="space-y-4 text-center py-6">
            <div className="mx-auto bg-green-50 rounded-full p-3 w-fit">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Request Sent Successfully</h3>
            <p className="text-muted-foreground">
              Your obituary record request has been submitted to our team. We
              will review it and get back to you via email. A confirmation has
              been sent to your email address.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              File Number: {obituaryRef}
            </p>
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        );

      case "authCheck":
      default:
        return (
          <div className="space-y-4">
            {/* Display error if fetching details failed */}
            {error && step === "authCheck" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Details</AlertTitle>
                <AlertDescription>
                  {error || "Could not load obituary details."}
                </AlertDescription>
              </Alert>
            )}

            {/* Display details if available */}
            {details && !error && (
              <>
                {details.hasImages ? (
                  <>
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">
                        Image Record Available
                      </AlertTitle>
                      <AlertDescription className="text-green-700">
                        This obituary has {details.imageCount} image record(s).
                        Members can download for free. Guests may proceed to
                        view purchase options ($10.00 CAD).
                      </AlertDescription>
                    </Alert>
                    <Alert className="bg-blue-50 border-blue-200">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">
                        PDF Report Included
                      </AlertTitle>
                      <AlertDescription className="text-blue-700">
                        A PDF report with indexing details is included. Free for
                        members, or with guest purchase.
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
                      We do not currently have a digitized image for this
                      record. Members or guests can submit an email request to
                      our team to search for it.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Fallback if details are not loaded and no error, e.g. initial state before fetch completes */}
            {!details && !error && step === "authCheck" && (
              <p className="text-sm text-muted-foreground">
                Loading record information...
              </p>
            )}

            <p className="pt-2">
              To download available obituary images and PDF reports for free,
              please sign in with your KDGS membership credentials.
            </p>
            <p className="text-sm text-muted-foreground">
              Alternatively, you can proceed as a guest. Image records for
              guests may require payment (details shown on the next step if
              applicable). If no image is found, you can submit an email
              request.
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

  const getDialogTexts = () => {
    switch (step) {
      case "infoDisplay":
      case "error":
        return {
          title: "Obituary Record Details",
          description: obituaryName ?? obituaryRef ?? "Details"
        };
      case "requestForm":
        return {
          title: "Obituary Image Request Form",
          description: obituaryName ?? obituaryRef ?? "Image Request"
        };
      case "requestSuccess":
        return {
          title: "Request Submitted",
          description: "Your request has been sent to our research team"
        };
      case "loadingDetails":
        return {
          title: "Loading...",
          description: "Fetching obituary details"
        };
      case "authCheck":
      default:
        return {
          title: "Request Obituary Record",
          description: "Authentication Check"
        };
    }
  };

  const { title, description } = getDialogTexts();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="py-4 pr-6">{renderContent()}</div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
