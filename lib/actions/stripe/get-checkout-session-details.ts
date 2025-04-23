"use server";

import Stripe from "stripe";
import { z } from "zod";

// Ensure Stripe secret key is available
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil" // Use the same API version as createCheckoutSession
});

const inputSchema = z.string().startsWith("cs_"); // Basic validation for checkout session ID format

interface CheckoutSessionDetails {
  customerEmail?: string | null;
  error?: string;
}

export async function getCheckoutSessionDetails(
  sessionId: unknown
): Promise<CheckoutSessionDetails> {
  // 1. Validate Input
  const validation = inputSchema.safeParse(sessionId);
  if (!validation.success) {
    console.error("Invalid session ID format:", validation.error);
    return { error: "Invalid session ID." };
  }
  const validSessionId = validation.data;

  try {
    // 2. Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(validSessionId, {
      expand: ["customer_details"] // Expand to get customer details including email
    });

    if (!session) {
      return { error: "Checkout session not found." };
    }

    // 3. Extract customer email
    const customerEmail = session.customer_details?.email;

    return { customerEmail };
  } catch (error) {
    console.error("Error retrieving Stripe Checkout session:", error);

    // Provide a more generic error to the client
    return {
      error:
        `Failed to retrieve session details. ${error instanceof Error ? error.message : ""}`.trim()
    };
  }
}
