import { Metadata } from "next";
import { SearchForm } from "./components/search-form";
import { ArrowDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FamilyRelationship } from "@prisma/client";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Search Obituary Records - KDGS",
  description:
    "Search through our collection of Central Okanagan obituary records to discover your family history"
};

async function getFamilyRelationships(): Promise<FamilyRelationship[]> {
  try {
    const relationships = await prisma.familyRelationship.findMany({
      orderBy: { name: "asc" }
    });
    return relationships;
  } catch (error) {
    console.error("Failed to fetch family relationships:", error);
    return []; // Return empty array on error
  }
}

export default async function SearchPage() {
  // Fetch both relationships and session data
  const [relationships, session] = await Promise.all([
    getFamilyRelationships(),
    getIronSession<SessionData>(cookies(), sessionOptions)
  ]);

  // Create a plain object for the session data to pass to the client component
  const plainSessionData: SessionData | null = session.isLoggedIn
    ? {
        isLoggedIn: session.isLoggedIn,
        username: session.username,
        displayName: session.displayName
      }
    : null;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-[#003B5C] bg-[url('/duck-lake.jpg')] bg-cover bg-top py-24 overflow-hidden">
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-[#003B5C] opacity-70"></div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Search Obituary Records
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed">
              Our collection of Central Okanagan obituaries can help you
              discover important details about your ancestors. Enter information
              about your family member, and we&apos;ll search our database of
              obituary records.
            </p>
            <div className="animate-bounce flex justify-center pt-8">
              <ArrowDown className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <main className="container mx-auto px-4 -mt-16 relative z-10 mb-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#003B5C] mb-2">
                Begin Your Search
              </h2>
              <p className="text-gray-600">
                Fill in any of the fields below to start discovering your family
                history
              </p>
            </div>
            <SearchForm
              relationships={relationships}
              session={plainSessionData}
            />
          </div>

          {/* Tips Section */}
          <div className="mt-16 text-left space-y-6 bg-green-50 p-8 rounded-xl border border-green-200">
            <h3 className="text-xl font-semibold text-green-800 mb-4">
              Tips for Effective Searching
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Finding family records can be rewarding! Here's a suggested
              approach to help you get the best results:
            </p>

            {/* Search Tips Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tip 1: Start with Names */}
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <h4 className="font-medium text-[#003B5C] mb-2">
                  1. Start with Names (Recommended)
                </h4>
                <p className="text-gray-600 text-sm">
                  Begin by entering the person's <strong>Surname</strong> and{" "}
                  <strong>Given Names</strong>. Add the{" "}
                  <strong>Maiden Name</strong> if you know it. Try different
                  spellings or nicknames if the first attempt doesn't work.
                </p>
              </div>

              {/* Tip 2: Narrow with Death Date */}
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <h4 className="font-medium text-[#003B5C] mb-2">
                  2. Narrow with Death Date/Year
                </h4>
                <p className="text-gray-600 text-sm">
                  If you get too many results, add the{" "}
                  <strong>Death Year</strong>, or the full{" "}
                  <strong>Death Date</strong> if known. This is often the most
                  helpful field after names.
                </p>
              </div>

              {/* Tip 3: Use Advanced Options */}
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <h4 className="font-medium text-[#003B5C] mb-2">
                  3. Use Advanced Options Sparingly
                </h4>
                <p className="text-gray-600 text-sm">
                  If needed, use the "Advanced Search Options" to add{" "}
                  <strong>Birth Date/Year</strong> or <strong>Places</strong>.
                  Be aware that older records may not have complete place
                  information.
                </p>
              </div>

              {/* Tip 4: Broaden if Needed */}
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <h4 className="font-medium text-[#003B5C] mb-2">
                  4. Broaden if No Results
                </h4>
                <p className="text-gray-600 text-sm">
                  If your search with dates/places finds nothing, try removing
                  them and searching only by name again. Our partial match
                  feature might find relevant records based just on the name.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
