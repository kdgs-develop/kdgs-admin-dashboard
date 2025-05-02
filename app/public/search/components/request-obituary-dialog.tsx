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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Wallet,
  LogIn,
  FileWarning,
  FileText,
  ShoppingCart,
  Send,
  Plus,
  Minus,
  Mail,
  CheckCircle
} from "lucide-react";
import type { SessionData } from "@/lib/session";
import {
  getObituaryDetails,
  ObituaryDetails
} from "@/lib/actions/public-search/get-obituary-details";
import { getObituaryImageUrls } from "@/lib/actions/public-search/get-obituary-image-urls";
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
  const [relatives, setRelatives] = useState<
    { name: string; relationship: string }[]
  >([{ name: "", relationship: "" }]);

  // Define the form schema
  const formSchema = z.object({
    requesterEmail: z.string().email("Please enter a valid email address"),
    requesterFullName: z.string().min(1, "Please enter your full name"),
    requesterCountry: z.string().min(1, "Please select your country"),
    requesterProvince: z.string().optional(),

    surname: z.string().min(1, "Surname is required"),
    givenNames: z.string().optional(),
    maidenName: z.string().optional(),
    alsoKnownAs: z.string().optional(),

    birthExactDate: z.string().optional(),
    birthYearFrom: z.string().optional(),
    birthYearTo: z.string().optional(),
    birthPlace: z.string().optional(),

    deathExactDate: z.string().optional(),
    deathYearFrom: z.string().optional(),
    deathYearTo: z.string().optional(),
    deathPlace: z.string().optional(),

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
      surname: "",
      givenNames: "",
      maidenName: "",
      alsoKnownAs: "",
      birthExactDate: "",
      birthYearFrom: "",
      birthYearTo: "",
      birthPlace: "",
      deathExactDate: "",
      deathYearFrom: "",
      deathYearTo: "",
      deathPlace: "",
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
      }, 300);
      return () => clearTimeout(timer);
    } else if (obituaryRef) {
      if (session?.isLoggedIn) {
        setIsGuestFlow(false);
        fetchDetails(obituaryRef);
      } else {
        setStep("authCheck");
        setIsGuestFlow(false);
      }
      setError(null);
      setDetails(null);
      setDownloadError(null);
      setIsDownloading(false);
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
    let pdfSuccess = false;
    let imagesSuccess = false;
    let errorMessages: string[] = [];

    try {
      // Record the member download as a completed order
      const orderResult = await recordMemberDownload({
        obituaryRef: reference,
        obituaryName: obituaryName || reference,
        customerEmail: session.username, // Using username field which may be an email
        customerFullName: session.displayName || ""
      });

      if (!orderResult.success) {
        console.warn(
          "Failed to record download as order, but continuing download:",
          orderResult.error
        );
      }

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

  const handleShowRequestForm = () => {
    setStep("requestForm");
  };

  const handleSendRequest = async (formData: ObituaryRequestFormData) => {
    try {
      startTransition(async () => {
        if (!obituaryRef) {
          setError("Missing obituary reference");
          setStep("error");
          return;
        }

        // Include obituary reference in the form data
        const requestData = {
          ...formData,
          obituaryRef: obituaryRef!,
          // Add relatives from state
          relatives: relatives.filter(rel => rel.name || rel.relationship)
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

  const addRelative = () => {
    setRelatives([...relatives, { name: "", relationship: "" }]);
  };

  const removeRelative = (index: number) => {
    if (relatives.length > 1) {
      setRelatives(relatives.filter((_, i) => i !== index));
    }
  };

  const updateRelative = (
    index: number,
    field: "name" | "relationship",
    value: string
  ) => {
    const newRelatives = [...relatives];
    newRelatives[index][field] = value;
    setRelatives(newRelatives);
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
            <h3 className="text-lg font-medium mb-4">Obituary Request</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide details below for the obituary search. Our team
              will use this information to try and locate the record. We will
              contact you via the email provided. Reference: {obituaryRef}
            </p>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(data => {
                  handleSendRequest({
                    ...data,
                    // Transform data for the server action format
                    birthYearRange: {
                      from: data.birthYearFrom || "",
                      to: data.birthYearTo || ""
                    },
                    deathYearRange: {
                      from: data.deathYearFrom || "",
                      to: data.deathYearTo || ""
                    },
                    obituaryRef: obituaryRef!, // Include the reference
                    relatives // Include the relatives from state
                  });
                })}
                className="space-y-4"
              >
                <ScrollArea className="h-[500px] px-1">
                  <div className="space-y-6 px-1">
                    {/* Requester Information Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Your Information</h4>

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
                                <SelectContent>
                                  {/* Popular countries first */}
                                  {POPULAR_COUNTRIES.map(country => (
                                    <SelectItem
                                      key={country.value}
                                      value={country.value}
                                    >
                                      {country.label}
                                    </SelectItem>
                                  ))}

                                  {/* Divider */}
                                  <SelectItem value="divider" disabled>
                                    ────────────────
                                  </SelectItem>

                                  {/* All other countries (excluding popular ones) */}
                                  {ALL_COUNTRIES.filter(
                                    country =>
                                      !POPULAR_COUNTRIES.some(
                                        popular =>
                                          popular.value === country.value
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
                    </div>

                    {/* Person to Find Section */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Person to Find</h4>

                      <FormField
                        control={form.control}
                        name="surname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Surname *</FormLabel>
                            <FormControl>
                              <Input placeholder="Family name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="givenNames"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Given Names</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="First and middle names"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="maidenName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maiden Name</FormLabel>
                              <FormControl>
                                <Input placeholder="If applicable" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="alsoKnownAs"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Also Known As</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nickname or alias"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Relatives Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Relatives</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addRelative}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>

                      {relatives.map((relative, index) => (
                        <div key={index} className="flex gap-4 items-end">
                          <div className="flex-1">
                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                              Name
                            </FormLabel>
                            <Input
                              placeholder="Relative's name"
                              value={relative.name}
                              onChange={e =>
                                updateRelative(index, "name", e.target.value)
                              }
                            />
                          </div>

                          <div className="flex-1">
                            <FormLabel className={index !== 0 ? "sr-only" : ""}>
                              Relationship
                            </FormLabel>
                            <Input
                              placeholder="e.g. Son, Wife"
                              value={relative.relationship}
                              onChange={e =>
                                updateRelative(
                                  index,
                                  "relationship",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRelative(index)}
                            disabled={relatives.length === 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Birth Information */}
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue="birth"
                      className="w-full"
                    >
                      <AccordionItem value="birth">
                        <AccordionTrigger>Birth Information</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            <FormField
                              control={form.control}
                              name="birthExactDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Exact Date (if known)</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="YYYY-MM-DD or any date format"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="birthYearFrom"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Year Range (From)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="YYYY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="birthYearTo"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Year Range (To)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="YYYY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="birthPlace"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Place</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="City, Province/State, Country"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Death Information */}
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue="death"
                      className="w-full"
                    >
                      <AccordionItem value="death">
                        <AccordionTrigger>Death Information</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-4">
                            <FormField
                              control={form.control}
                              name="deathExactDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Exact Date (if known)</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="YYYY-MM-DD or any date format"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="deathYearFrom"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Year Range (From)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="YYYY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="deathYearTo"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Year Range (To)</FormLabel>
                                    <FormControl>
                                      <Input placeholder="YYYY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="deathPlace"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Place</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="City, Province/State, Country"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Notes Section */}
                    <div className="space-y-4">
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
                </ScrollArea>

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
              Reference: {obituaryRef}
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
            <p>
              To download available obituary images and PDF reports for free,
              please sign in with your KDGS membership credentials.
            </p>
            <p className="text-sm text-muted-foreground">
              Alternatively, you can proceed as a guest. Image records for
              guests may require payment (details shown on the next step). If no
              image is found, you can submit an email request.
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
          title: "Obituary Request Form",
          description: obituaryName ?? obituaryRef ?? "Record Request Form"
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
        <div className="py-4 min-h-[150px]">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
