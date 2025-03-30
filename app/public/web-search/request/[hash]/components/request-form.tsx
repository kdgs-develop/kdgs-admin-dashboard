"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckoutSession } from "../../../lib/actions";
import { ObituaryResult } from "../../../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RequestFormProps {
  obituary: ObituaryResult;
}

export function RequestForm({ obituary }: RequestFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const session = await createCheckoutSession(
        obituary.id,
        obituary.reference
      );

      if (!session || !session.url) {
        throw new Error("Failed to create checkout session");
      }

      // Store email in localStorage to retrieve after payment
      localStorage.setItem("obituary_email", email);
      localStorage.setItem("obituary_reference", obituary.reference);

      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        "An error occurred while processing your request. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email Address</Label>
        <p className="text-sm text-gray-500 mb-2">
          We'll send the obituary files to this email after payment
        </p>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full"
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="pt-2">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Processing..." : "Pay $5.00 CAD"}
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1 pt-2">
        <p>
          By clicking the button above, you'll be redirected to our secure
          payment processor (Stripe).
        </p>
        <p>
          After completing payment, you'll receive the obituary files via email.
        </p>
      </div>
    </form>
  );
}
