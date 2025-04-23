import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DownloadButton } from "./download-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, Info, ArrowLeft } from "lucide-react";
import { getObituaryDetails } from "@/lib/actions/public-search/get-obituary-details";
import Image from "next/image";
import { getCheckoutSessionDetails } from "@/lib/actions/stripe/get-checkout-session-details";
import { getOrderDetailsByToken } from "@/lib/actions/orders/get-order-details-by-token";

// Component to display payment details and download links
async function PaymentDetails({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const token = searchParams?.token;
  const sessionId = searchParams?.session_id;

  // Basic validation: Ensure token and session ID are present
  if (typeof token !== "string" || typeof sessionId !== "string") {
    return (
      <Alert variant="destructive" className="mt-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Invalid Request</AlertTitle>
        <AlertDescription>
          Missing payment confirmation details. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  // Fetch order and session details concurrently
  const orderDetailsPromise = getOrderDetailsByToken(token);
  const sessionDetailsPromise = getCheckoutSessionDetails(sessionId);

  const [orderDetails, sessionDetails] = await Promise.all([
    orderDetailsPromise,
    sessionDetailsPromise
  ]);

  // Handle errors from fetching details
  if (orderDetails.error || sessionDetails.error) {
    const errorMessage = orderDetails.error || sessionDetails.error;
    return (
      <Alert variant="destructive" className="mt-4">
        <Info className="h-4 w-4" />
        <AlertTitle>Error Retrieving Details</AlertTitle>
        <AlertDescription>
          {errorMessage || "Could not load your purchase details."}
        </AlertDescription>
      </Alert>
    );
  }

  // Extract data (we know these exist if no error)
  const orderId = orderDetails.orderId!;
  const obituaryRefs = orderDetails.obituaryRefs!;
  const customerEmail = sessionDetails.customerEmail;
  const customerFullName = sessionDetails.customerFullName;
  const customerCountry = sessionDetails.customerCountry;

  // Fetch individual obituary details concurrently
  const obituaryDetailsPromises = obituaryRefs.map(ref =>
    getObituaryDetails(ref)
  );
  const obituaryDetailsResults = await Promise.all(obituaryDetailsPromises);

  return (
    <div className="mt-8 space-y-6">
      <div className="space-y-4">
        {obituaryRefs.map((ref, index) => {
          const detailsResult = obituaryDetailsResults[index];
          // Handle potential error fetching individual obituary details
          if (detailsResult.error || !detailsResult.data) {
            return (
              <Alert key={ref} variant="destructive" className="my-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Error Loading Obituary</AlertTitle>
                <AlertDescription>
                  Could not load details for reference {ref}.
                  {detailsResult.error ? ` (${detailsResult.error})` : ""}
                </AlertDescription>
              </Alert>
            );
          }

          const details = detailsResult.data;
          const hasImages = details.hasImages;
          const imageCount = details.imageCount;

          return (
            <div
              key={ref}
              className="space-y-4 p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="space-y-2">
                <h3 className="font-medium text-lg text-gray-900">
                  {[details.title?.name, details.givenNames, details.surname]
                    .filter(Boolean)
                    .join(" ") || "Unknown"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Reference: {ref}
                </p>
              </div>

              {hasImages ? (
                <>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">
                      Image Record Available
                    </AlertTitle>
                    <AlertDescription className="text-green-700">
                      This obituary has {imageCount} image record(s) available
                      for download.
                    </AlertDescription>
                  </Alert>
                  <Alert className="bg-blue-50 border-blue-200">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">
                      PDF Report Included
                    </AlertTitle>
                    <AlertDescription className="text-blue-700">
                      A PDF report containing the obituary details is included
                      with your image download.
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

              <div className="flex justify-center">
                <DownloadButton obituaryRef={ref} />
              </div>
            </div>
          );
        })}
      </div>
      {/* Display Customer and Order Info */}
      <div className="text-sm text-muted-foreground space-y-1 text-center border-t pt-4 mt-6">
        {customerFullName && <p>Customer: {customerFullName}</p>}
        {customerEmail && <p>Email: {customerEmail}</p>}
        {customerCountry && <p>Country: {customerCountry}</p>}
        <p>Order ID: {orderId}</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/duck-lake.jpg"
          alt="Peaceful lake background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="container relative z-10 flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mx-auto max-w-2xl w-full px-4">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-green-100/80 rounded-full"></div>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-16 w-16 text-green-500 relative z-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Payment Successful!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Thank you for your purchase. Your obituary records are ready
                  for download.
                </p>
              </div>

              {/* Wrap details component in Suspense as it reads searchParams */}
              <Suspense
                fallback={
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                }
              >
                <PaymentDetails searchParams={searchParams} />
              </Suspense>

              <div className="pt-6">
                <Link
                  href="/public/search"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "group inline-flex items-center gap-2 bg-white hover:bg-gray-50"
                  )}
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Return to Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
