import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil"
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  console.log("🎯 Webhook endpoint hit at /api/stripe-webhook");

  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature");

    if (!signature) {
      console.error("❌ No Stripe signature found");
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

        console.log("📦 Processing completed session:", {
          orderId,
          clientReferenceId,
          sessionId: session.id
        });

        if (!orderId || !clientReferenceId || orderId !== clientReferenceId) {
          console.error("❌ Missing or mismatched IDs", {
            orderId,
            clientReferenceId,
            sessionId: session.id
          });
          return NextResponse.json(
            { received: true, error: "Missing or mismatched IDs" },
            { status: 200 }
          );
        }

        try {
          const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.COMPLETED,
              stripePaymentIntentId: session.payment_intent as string
            }
          });

          console.log(
            `✅ Order ${updatedOrder.id} updated to ${updatedOrder.status}`
          );
          return NextResponse.json(
            { received: true, orderId },
            { status: 200 }
          );
        } catch (error) {
          console.error(
            `❌ Database update failed for order ${orderId}:`,
            error
          );
          return NextResponse.json(
            { received: true, error: "Failed to update order" },
            { status: 200 }
          );
        }
      }

      case "checkout.session.async_payment_failed":
      case "checkout.session.expired": {
        const orderId = session?.metadata?.orderId;
        if (!orderId) {
          console.error(`❌ Missing orderId in ${event.type}`);
          return NextResponse.json(
            { received: true, error: "Missing orderId" },
            { status: 200 }
          );
        }

        try {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.FAILED }
          });
          console.log(`✅ Order ${orderId} marked as FAILED`);
          return NextResponse.json({ received: true }, { status: 200 });
        } catch (error) {
          console.error(`❌ Failed to mark order ${orderId} as failed:`, error);
          return NextResponse.json(
            { received: true, error: "Failed to update order" },
            { status: 200 }
          );
        }
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        return NextResponse.json(
          { received: true, message: "Unhandled event type" },
          { status: 200 }
        );
    }
  } catch (error) {
    console.error("❌ Webhook handler failed:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
