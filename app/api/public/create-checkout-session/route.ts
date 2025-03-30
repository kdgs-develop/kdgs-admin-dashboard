import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16"
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();
    const { obituaryId, obituaryReference } = data;

    if (!obituaryId || !obituaryReference) {
      return NextResponse.json(
        { error: "Obituary ID and reference are required" },
        { status: 400 }
      );
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Obituary Request",
              description: `Obituary reference: ${obituaryReference}`
            },
            unit_amount: 500 // $5.00 in cents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/public/web-search/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/public/web-search/request/${obituaryReference}?canceled=true`,
      metadata: {
        obituaryId: obituaryId.toString(),
        obituaryReference
      }
    });

    return NextResponse.json({
      id: session.id,
      url: session.url
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
