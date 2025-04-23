import Link from "next/link";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Optional: Component to read and display details from URL params
function PaymentDetails({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const sessionId = searchParams?.session_id;
  const orderId = searchParams?.order_id;

  // You could potentially fetch order details here using orderId
  // Be cautious about displaying sensitive info directly on the client

  return (
    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
      {orderId && <p>Order ID: {orderId}</p>}
      {sessionId && <p>Stripe Session ID: {sessionId}</p>}
      {/* Add more details if needed */}
    </div>
  );
}

export default function PaymentSuccessPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-12">
      <div className="mx-auto max-w-md text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto mb-4 h-16 w-16 text-green-500"
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
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Payment Successful!
        </h1>
        <p className="mb-6 text-muted-foreground">
          Thank you for your purchase. Your order is being processed.
        </p>

        {/* Wrap details component in Suspense as it reads searchParams */}
        <Suspense fallback={<div>Loading details...</div>}>
          <PaymentDetails searchParams={searchParams} />
        </Suspense>

        <div className="mt-8">
          <Link
            href="/public/search" // Link back to the main search page
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Return to Search
          </Link>
        </div>
      </div>
    </div>
  );
}
