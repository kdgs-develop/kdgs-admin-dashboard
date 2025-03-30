"use server";

import { prisma } from "@/lib/prisma";
import { ObituaryResult, PaymentSession } from "../types";
import Stripe from "stripe";
import { env } from "process";
import { EmailTemplate } from "./email-template";
import { Resend } from "resend";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16"
});

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function getObituariesByName(
  query: string
): Promise<ObituaryResult[]> {
  if (!query.trim()) {
    return [];
  }

  // Split the query into words to search across surname and given names
  const searchTerms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  if (searchTerms.length === 0) {
    return [];
  }

  const obituaries = await prisma.obituary.findMany({
    where: {
      OR: [
        {
          surname: {
            contains: searchTerms.join(" "),
            mode: "insensitive"
          }
        },
        {
          givenNames: {
            contains: searchTerms.join(" "),
            mode: "insensitive"
          }
        },
        ...searchTerms.map(term => ({
          OR: [
            { surname: { contains: term, mode: "insensitive" } },
            { givenNames: { contains: term, mode: "insensitive" } }
          ]
        }))
      ],
      publicHash: {
        not: null
      }
    },
    select: {
      id: true,
      reference: true,
      surname: true,
      givenNames: true,
      maidenName: true,
      birthDate: true,
      deathDate: true,
      notes: true,
      proofread: true,
      publicHash: true,
      title: {
        select: {
          name: true
        }
      },
      imageNames: true,
      fileImages: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      surname: "asc"
    },
    take: 20
  });

  return obituaries;
}

export async function getObituaryByHash(
  publicHash: string
): Promise<ObituaryResult | null> {
  if (!publicHash) {
    return null;
  }

  const obituary = await prisma.obituary.findFirst({
    where: {
      publicHash
    },
    select: {
      id: true,
      reference: true,
      surname: true,
      givenNames: true,
      maidenName: true,
      birthDate: true,
      deathDate: true,
      notes: true,
      proofread: true,
      publicHash: true,
      title: {
        select: {
          name: true
        }
      },
      imageNames: true,
      fileImages: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return obituary;
}

export async function createCheckoutSession(
  obituaryId: number,
  obituaryReference: string
): Promise<PaymentSession | null> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key is not configured");
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

    return {
      id: session.id,
      url: session.url || ""
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return null;
  }
}

export async function sendObituaryEmail(
  email: string,
  obituaryReference: string,
  fileUrls: string[]
): Promise<boolean> {
  try {
    await resend.emails.send({
      from: "KDGS Obituaries <obituaries@kdgs.org>",
      to: [email],
      subject: "Your Requested Obituary Files",
      react: EmailTemplate({
        customerName: email.split("@")[0],
        obituaryReference,
        fileUrls
      })
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
