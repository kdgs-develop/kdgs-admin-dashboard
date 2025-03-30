"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

interface PaymentStatusProps {
  sessionId: string;
}

export function PaymentStatus({ sessionId }: PaymentStatusProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function verifyPayment() {
      try {
        // Fetch the email from localStorage that was stored during checkout
        const storedEmail = localStorage.getItem("obituary_email");
        const storedReference = localStorage.getItem("obituary_reference");

        if (storedEmail) {
          setEmail(storedEmail);
        }

        // Verify payment with the API
        const response = await fetch(
          `/api/public/verify-payment?session_id=${sessionId}`,
          {
            method: "GET"
          }
        );

        const data = await response.json();

        if (data.success) {
          setStatus("success");

          // Clear the localStorage after successful verification
          localStorage.removeItem("obituary_email");
          localStorage.removeItem("obituary_reference");
        } else {
          setStatus("error");
          setError(
            data.error || "An error occurred during payment verification."
          );
        }
      } catch (err) {
        console.error("Failed to verify payment:", err);
        setStatus("error");
        setError("Failed to verify payment. Please contact support.");
      }
    }

    verifyPayment();
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          Verifying payment...
        </h2>
        <p className="text-gray-600">
          Please wait while we verify your payment.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center py-8">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          Payment Verification Failed
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-gray-600">
          If you believe this is an error, please contact our support team.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-medium text-gray-900 mb-2">
        Payment Successful!
      </h2>
      <p className="text-gray-600 mb-4">
        Thank you for your payment. We have sent the obituary files to your
        email.
      </p>
      {email && (
        <p className="text-gray-600">
          Please check <span className="font-medium">{email}</span> for your
          files.
        </p>
      )}
      <p className="text-gray-500 text-sm mt-6">
        If you don't receive the email within a few minutes, please check your
        spam folder.
      </p>
    </div>
  );
}
