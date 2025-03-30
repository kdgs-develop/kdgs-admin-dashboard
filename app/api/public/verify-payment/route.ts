import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendObituaryEmail } from "@/app/public/web-search/lib/actions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16"
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if the payment was successful
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Payment has not been completed" },
        { status: 400 }
      );
    }

    // Extract information from session metadata
    const obituaryId = session.metadata?.obituaryId;
    const obituaryReference = session.metadata?.obituaryReference;
    const customerEmail = session.customer_details?.email;

    if (!obituaryId || !obituaryReference || !customerEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required metadata" },
        { status: 400 }
      );
    }

    // Get the obituary to retrieve file information
    const obituary = await prisma.obituary.findFirst({
      where: {
        id: parseInt(obituaryId)
      },
      select: {
        imageNames: true,
        fileImages: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!obituary) {
      return NextResponse.json(
        { success: false, error: "Obituary not found" },
        { status: 404 }
      );
    }

    // Generate signed URLs for the files
    const fileUrls: string[] = [];

    // Generate URLs for image names
    if (obituary.imageNames && obituary.imageNames.length > 0) {
      for (const imageName of obituary.imageNames) {
        // In a real implementation, you would generate a signed URL here
        // For now, we'll just use a placeholder URL
        fileUrls.push(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/files/${imageName}`
        );
      }
    }

    // Generate URLs for file images
    if (obituary.fileImages && obituary.fileImages.length > 0) {
      for (const fileImage of obituary.fileImages) {
        // In a real implementation, you would generate a signed URL here
        fileUrls.push(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/files/${fileImage.id}`
        );
      }
    }

    // Send the email with the file URLs
    const emailSent = await sendObituaryEmail(
      customerEmail,
      obituaryReference,
      fileUrls
    );

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send email with files. Please contact support."
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      obituaryId: parseInt(obituaryId),
      obituaryReference,
      customerEmail
    });
  } catch (error) {
    console.error("Error verifying payment:", error);

    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
