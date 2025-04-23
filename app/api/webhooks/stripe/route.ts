import "server-only"; // Ensure this runs only on the server

import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { OrderStatus } from "@prisma/client"; // Import OrderStatus enum

import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil" // Use the latest stable API version
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Define allowed HTTP methods
export async function POST(request: NextRequest) {
  console.log("🎯 Webhook endpoint hit");

  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      console.error("❌ No Stripe signature found in request headers");
      return NextResponse.json(
        { error: "No Stripe signature found" },
        { status: 400 }
      );
    }

    // Verify the event
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log(`✨ Webhook event received: ${event.type}`);

    // Handle the event
    const session = event.data.object as Stripe.Checkout.Session;

    switch (event.type) {
      case "checkout.session.completed": {
        const orderId = session?.metadata?.orderId;
        const clientReferenceId = session?.client_reference_id;

        if (!orderId || !clientReferenceId || orderId !== clientReferenceId) {
          console.error(
            "❌ Metadata orderId or client_reference_id missing or mismatched",
            { orderId, clientReferenceId, sessionId: session.id }
          );
          return NextResponse.json(
            { received: true, error: "Missing or mismatched IDs" },
            { status: 200 }
          );
        }

        console.log(`✅ Processing successful payment for order: ${orderId}`);

        try {
          const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.COMPLETED,
              stripePaymentIntentId: session.payment_intent as string
            }
          });

          console.log(
            `📦 Order ${updatedOrder.id} status updated to ${updatedOrder.status}`
          );

          return NextResponse.json(
            { received: true, orderId },
            { status: 200 }
          );
        } catch (error) {
          console.error(`❌ Error updating order ${orderId}:`, error);
          return NextResponse.json(
            { received: true, error: "Failed to update order" },
            { status: 200 }
          );
        }
      }

      case "checkout.session.async_payment_failed": {
        const orderId = session?.metadata?.orderId;
        if (!orderId) {
          console.error("❌ Missing orderId in async_payment_failed event");
          return NextResponse.json(
            { received: true, error: "Missing orderId" },
            { status: 200 }
          );
        }

        await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.FAILED }
        });

        return NextResponse.json({ received: true }, { status: 200 });
      }

      case "checkout.session.expired": {
        const orderId = session?.metadata?.orderId;
        if (!orderId) {
          console.error("❌ Missing orderId in expired event");
          return NextResponse.json(
            { received: true, error: "Missing orderId" },
            { status: 200 }
          );
        }

        await prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.FAILED }
        });

        return NextResponse.json({ received: true }, { status: 200 });
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        return NextResponse.json(
          { received: true, message: "Unhandled event type" },
          { status: 200 }
        );
    }
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

// Optionally define other HTTP methods to return proper error responses
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
