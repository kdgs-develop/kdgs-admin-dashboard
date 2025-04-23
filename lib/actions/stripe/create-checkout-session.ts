"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

import { sessionOptions, SessionData } from "@/lib/session";

// Ensure Stripe secret key is available
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil" // Use the latest API version
});

// Define input schema matching CartItem but maybe less strict for action
const cartItemSchema = z.object({
  ref: z.string(),
  name: z.string(),
  hasImages: z.boolean() // We don't strictly need hasImages here, but keep for consistency?
});

const inputSchema = z.array(cartItemSchema);

// Define the structure of items that will be purchased (have images)
interface PurchaseItem {
  ref: string;
  name: string;
  price: number; // Price in cents
}

export async function createCheckoutSession(cartItems: unknown): Promise<{
  sessionId?: string;
  error?: string;
}> {
  // 1. Verify User is Guest
  // @ts-ignore // Suppress type error for this line temporarily
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (session.isLoggedIn) {
    // Maybe redirect logged-in users or return an error?
    // For now, assume this action is only called for guests.
    return { error: "Checkout is only for guest users." };
  }
  const guestSessionId = session.guestId; // Example: Get guest ID if stored in session

  // 2. Validate Input
  const validation = inputSchema.safeParse(cartItems);
  if (!validation.success) {
    console.error("Invalid cart items format:", validation.error);
    return { error: "Invalid cart data." };
  }
  const validCartItems = validation.data;

  // Filter items eligible for purchase (with images) and define price
  const itemsToPurchase: PurchaseItem[] = validCartItems
    .filter(item => item.hasImages)
    .map(item => ({
      ref: item.ref,
      name: item.name,
      price: 1000 // $10.00 CAD in cents - adjust if price varies
    }));

  if (itemsToPurchase.length === 0) {
    return { error: "No items eligible for purchase in the cart." };
  }

  // Calculate total amount
  const totalAmount = itemsToPurchase.reduce(
    (sum, item) => sum + item.price,
    0
  );

  // 3. Check for Base URL environment variable
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_BASE_URL environment variable is not set.");
    return { error: "Server configuration error." };
  }

  let orderId: string | null = null; // To store the created order ID

  try {
    // 4. Create Pending Order in Database
    const order = await prisma.order.create({
      data: {
        status: OrderStatus.PENDING,
        totalAmount: totalAmount,
        currency: "cad",
        guestSessionId: guestSessionId, // Store guest session ID if available
        // userId: session.userId, // If handling logged-in users
        items: {
          create: itemsToPurchase.map(item => ({
            obituaryRef: item.ref,
            obituaryName: item.name,
            price: item.price
          }))
        }
      },
      select: { id: true } // Select only the ID
    });
    orderId = order.id; // Store the ID

    // Ensure orderId is valid before proceeding
    if (!orderId) {
      throw new Error("Failed to create order record.");
    }

    // 5. Map items to Stripe line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      itemsToPurchase.map(item => {
        return {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: item.price, // Use the defined price
            product_data: {
              name: "Obituary Record", // Generic name
              description: `Digital access for ${item.name} (Ref: ${item.ref})`,
              metadata: {
                // Optional: keep product-level metadata if needed elsewhere
                obituary_ref: item.ref
              }
            }
          }
        };
      });

    // 6. Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&obituary_refs=${itemsToPurchase.map(item => item.ref).join(",")}`,
      cancel_url: `${baseUrl}?order_id=${orderId}`,
      metadata: {
        orderId: orderId
      },
      client_reference_id: orderId
    });

    if (!checkoutSession.id) {
      // If session creation fails, maybe mark the order as FAILED?
      // Or rely on a cleanup job. For now, throw error.
      throw new Error("Failed to create Stripe Checkout session.");
    }

    // 7. Update Order with Stripe Session ID
    await prisma.order.update({
      where: { id: orderId },
      data: { stripeCheckoutSessionId: checkoutSession.id }
    });

    return { sessionId: checkoutSession.id };
  } catch (error) {
    console.error("Error creating Stripe Checkout session:", error);

    // Optional: Update the order status to FAILED if an order was created
    if (orderId) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.FAILED }
        });
      } catch (updateError) {
        console.error("Failed to update order status to FAILED:", updateError);
      }
    }

    // Provide a more generic error to the client
    return {
      error:
        `Failed to initiate checkout. ${error instanceof Error ? error.message : ""}`.trim()
    };
  }
}
