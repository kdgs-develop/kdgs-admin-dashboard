import "server-only"; // Ensure this runs only on the server

import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { OrderStatus } from "@prisma/client"; // Import OrderStatus enum
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";
import { OrderConfirmationEmailTemplate } from "@/components/emails/order-confirmation-template";

// --- Resend Config ---
const resend = new Resend(process.env.RESEND_API_KEY);
// --- ---

// --- Environment Variable Checks ---
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;
// --- ---

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment variables.");
}

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY in environment variables.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-05-28.basil" // Use a stable API version
});

// --- Main Webhook Handler ---
export async function POST(request: NextRequest) {
  console.log("🎯 Webhook endpoint hit");

  // --- Check for necessary environment variables on each request ---
  if (!webhookSecret) {
    console.error("❌ Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }
  if (!baseUrl) {
    console.error("❌ Missing NEXT_PUBLIC_BASE_URL");
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }
  // --- ---

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
    const sessionFromEvent = event.data.object as Stripe.Checkout.Session;

    switch (event.type) {
      case "checkout.session.completed": {
        console.log(`⏳ Processing event: ${event.type}`);
        // Retrieve the full session object with expanded details
        let sessionWithDetails: Stripe.Checkout.Session;
        try {
          sessionWithDetails = await stripe.checkout.sessions.retrieve(
            sessionFromEvent.id,
            { expand: ["customer_details", "customer_details.address"] }
          );
        } catch (retrieveError) {
          console.error(
            `❌ Error retrieving session ${sessionFromEvent.id}:`,
            retrieveError
          );
          // Respond 200 to Stripe to avoid retries for a session that might not exist
          return NextResponse.json(
            { received: true, error: "Failed to retrieve session" },
            { status: 200 }
          );
        }

        const orderId = sessionWithDetails?.metadata?.orderId;
        const clientReferenceId = sessionWithDetails?.client_reference_id;
        const successToken = sessionWithDetails?.metadata?.successToken; // Get token
        const obituaryRefsString =
          sessionWithDetails?.metadata?.obituaryRefsString; // Get refs string
        const customerEmail = sessionWithDetails?.customer_details?.email;
        const customerFullName = sessionWithDetails?.customer_details?.name;
        const customerCountry =
          sessionWithDetails?.customer_details?.address?.country;

        // --- Validation ---
        if (!orderId || !clientReferenceId || orderId !== clientReferenceId) {
          console.error(
            "❌ Metadata orderId/client_reference_id missing/mismatched",
            { orderId, clientReferenceId, sessionId: sessionWithDetails.id }
          );
          return NextResponse.json(
            { received: true, error: "Missing/mismatched IDs" },
            { status: 200 }
          );
        }
        if (!successToken) {
          console.error(
            `❌ Missing successToken in metadata for order ${orderId}`
          );
          // Decide if this is critical. Maybe proceed without sending email? For now, log and continue.
        }
        if (!customerEmail) {
          console.warn(
            `⚠️ Missing customer email for order ${orderId}. Cannot send confirmation email.`
          );
          // Proceed with order update, but skip email
        }
        if (!obituaryRefsString) {
          console.warn(
            `⚠️ Missing obituaryRefsString in metadata for order ${orderId}. Email content may be incomplete.`
          );
          // Proceed with order update and email, but log warning
        }
        // --- End Validation ---

        console.log(`✅ Processing successful payment for order: ${orderId}`);

        try {
          // Update Order in DB
          const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.COMPLETED,
              stripePaymentIntentId:
                sessionWithDetails.payment_intent as string,
              ...(customerEmail && { customerEmail }),
              ...(customerFullName && { customerFullName }),
              ...(customerCountry && { customerCountry })
            }
          });
          console.log(
            `📦 Order ${updatedOrder.id} status updated to ${updatedOrder.status} & customer details saved.`
          );

          // --- Send Confirmation Email with Resend ---
          if (customerEmail && successToken && baseUrl) {
            const downloadLink = `${baseUrl}/payment-success?token=${successToken}&session_id=${sessionWithDetails.id}`;

            try {
              console.log(
                `📧 Attempting to send order confirmation to ${customerEmail}`
              );
              const { data, error } = await resend.emails.send({
                from: "Kelowna & District Genealogical Society <no-reply@obits.kdgs.ca>",
                to: [customerEmail],
                subject: `Your KDGS Obituary Record Download - Order #${orderId}`,
                replyTo: "obits@kdgs.ca",
                react: OrderConfirmationEmailTemplate({
                  customerName: customerFullName || "Valued Customer",
                  downloadLink,
                  orderId,
                  obituaryRefsList: obituaryRefsString || "N/A"
                })
              });

              if (error) {
                console.error(
                  `❌ Resend send failed for order ${orderId}:`,
                  error
                );
              } else {
                console.log(
                  `✅ Email sent successfully for order ${orderId}:`,
                  data
                );
              }
            } catch (emailError) {
              console.error(
                `❌ Unexpected error sending email for order ${orderId}:`,
                emailError
              );
            }
          } else {
            console.warn(
              `⚠️ Skipping email for order ${orderId} due to missing email, token, or base URL.`
            );
          }
          // --- End Send Email ---

          return NextResponse.json(
            { received: true, orderId },
            { status: 200 }
          );
        } catch (error) {
          console.error(
            `❌ Error updating order ${orderId} or sending email:`,
            error
          );
          // Return 200 so Stripe doesn't retry for DB errors after successful payment
          return NextResponse.json(
            { received: true, error: "Failed to update order or send email" },
            { status: 200 }
          );
        }
      }

      case "checkout.session.async_payment_failed": {
        console.log(`⏳ Processing event: ${event.type}`);
        const orderId = sessionFromEvent?.metadata?.orderId;
        if (!orderId) {
          console.error("❌ Missing orderId in async_payment_failed event");
          return NextResponse.json(
            { received: true, error: "Missing orderId" },
            { status: 200 }
          );
        }
        try {
          await prisma.order.update({
            where: { id: orderId, status: { not: OrderStatus.COMPLETED } }, // Avoid overwriting completed
            data: { status: OrderStatus.FAILED }
          });
          console.log(
            `📦 Order ${orderId} status updated to FAILED (async fail).`
          );
        } catch (error) {
          console.error(`❌ Error updating order ${orderId} to FAILED:`, error);
        }
        return NextResponse.json({ received: true }, { status: 200 });
      }

      case "checkout.session.expired": {
        console.log(`⏳ Processing event: ${event.type}`);
        const orderId = sessionFromEvent?.metadata?.orderId;
        if (!orderId) {
          console.error("❌ Missing orderId in expired event");
          return NextResponse.json(
            { received: true, error: "Missing orderId" },
            { status: 200 }
          );
        }
        try {
          await prisma.order.update({
            where: { id: orderId, status: { not: OrderStatus.COMPLETED } }, // Avoid overwriting completed
            data: { status: OrderStatus.FAILED } // Treat expired as failed? Or another status?
          });
          console.log(
            `📦 Order ${orderId} status updated to FAILED (session expired).`
          );
        } catch (error) {
          console.error(
            `❌ Error updating order ${orderId} to FAILED (expired):`,
            error
          );
        }
        return NextResponse.json({ received: true }, { status: 200 });
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        return NextResponse.json(
          { received: true, message: "Unhandled event type" },
          { status: 200 }
        );
    }
  } catch (error: any) {
    // Catch specific errors if possible
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      console.error("❌ Stripe signature verification failed:", error.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    console.error("❌ Webhook general error:", error);
    // Return 400 for signature errors, maybe 500 for others?
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
