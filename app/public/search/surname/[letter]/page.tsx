import { prisma } from "@/lib/prisma";
import { getObituariesByLetter } from "./actions";
import { Metadata } from "next";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";
import { AlphabeticalResults } from "../../components/alphabetical-results";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Stripe from "stripe";

const PAGE_SIZE = 100;

// Ensure Stripe secret key is available
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil" // Use the latest API version
});

async function getProductPrice(): Promise<string> {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    console.error("STRIPE_PRICE_ID is not set.");
    return "Not Available"; // Fallback price
  }

  try {
    const price = await stripe.prices.retrieve(priceId);
    if (!price || typeof price.unit_amount !== "number") {
      console.error(`Could not retrieve a valid price for ID: ${priceId}`);
      return "Not Available"; // Fallback price
    }
    return (price.unit_amount / 100).toFixed(2);
  } catch (error) {
    console.error("Failed to fetch Stripe price:", error);
    return "Not Available"; // Fallback price on error
  }
}

interface AlphabeticalSearchPageProps {
  params: {
    letter: string;
  };
}

export async function generateStaticParams() {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter => ({
    letter
  }));
}

export async function generateMetadata({
  params
}: AlphabeticalSearchPageProps): Promise<Metadata> {
  const letter = params.letter.toUpperCase();

  if (letter.length !== 1 || !/^[A-Z]$/.test(letter)) {
    return {
      title: "Invalid Page"
    };
  }

  return {
    title: `Obituaries: Surnames Starting with '${letter}' - KDGS`,
    description: `Browse the collection of obituaries for surnames starting with the letter ${letter}.`
  };
}

export default async function AlphabeticalSearchPage({
  params
}: AlphabeticalSearchPageProps) {
  const letter = params.letter.toUpperCase();

  if (letter.length !== 1 || !/^[A-Z]$/.test(letter)) {
    notFound();
  }

  const [{ results, totalCount }, session, productPrice] = await Promise.all([
    getObituariesByLetter(letter, 1),
    getIronSession<SessionData>(cookies(), sessionOptions),
    getProductPrice()
  ]);

  const plainSessionData: SessionData | null = session.isLoggedIn
    ? {
        isLoggedIn: session.isLoggedIn,
        username: session.username,
        displayName: session.displayName
      }
    : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              href="/public/search"
              className="flex items-center text-sm text-gray-600 hover:text-[#003B5C] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Main Search
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mt-4">
              Surnames Starting with "{letter}"
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              {totalCount > 0
                ? `Showing ${Math.min(1, totalCount)} - ${Math.min(
                    PAGE_SIZE,
                    totalCount
                  )} of ${totalCount} matching records.`
                : "No matching records found."}
            </p>
          </div>

          <AlphabeticalResults
            initialResults={results}
            totalCount={totalCount}
            letter={letter}
            session={plainSessionData}
            pageSize={PAGE_SIZE}
            productPrice={productPrice}
          />
        </div>
      </main>
    </div>
  );
}
