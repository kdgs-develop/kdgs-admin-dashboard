import { Metadata } from "next";
import { SearchForm } from "./components/search-form";
import { ArrowDown } from "lucide-react";
// import { prisma } from "@/lib/prisma"; // No longer needed if getFamilyRelationships is removed
// import { FamilyRelationship } from "@prisma/client"; // No longer needed
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Search Obituary Records - KDGS",
  description:
    "Search through our collection of Central Okanagan obituary records to discover your family history"
};

// async function getFamilyRelationships(): Promise<FamilyRelationship[]> { // Function no longer needed
//   try {
//     const relationships = await prisma.familyRelationship.findMany({
//       orderBy: { name: "asc" }
//     });
//     return relationships;
//   } catch (error) {
//     console.error("Failed to fetch family relationships:", error);
//     return []; // Return empty array on error
//   }
// }

export default async function SearchPage() {
  // Fetch session data
  // const [relationships, session] = await Promise.all([ // relationships no longer fetched
  //   getFamilyRelationships(),
  //   getIronSession<SessionData>(cookies(), sessionOptions)
  // ]);
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

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
      <div className="relative bg-[#003B5C] bg-[url('/duck-lake.jpg')] bg-cover bg-center py-24 overflow-hidden">
        {/* White Overlay */}
        <div className="absolute inset-0 bg-white/40"></div>

        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/70 rounded-2xl shadow-2xl p-8 border border-white/10">
              <div className="space-y-8">
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                  Search Obituary Records
                </h1>
                <div className="text-gray-800 leading-7 space-y-4">
                  <p>
                    Since 2010, we have been indexing obituaries of individuals
                    who passed away in the Central Okanagan. As of 2025, our
                    collection includes records for over 24,000 people, with
                    some entries dating back as early as 1913.
                  </p>
                  <p>
                    Now, for the first time, we are making this database
                    available for you to search for family members or friends
                    from the region.
                  </p>
                  <p>
                    If you find an obituary you would like to download, simply
                    proceed to the shopping cart.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">•</span>
                      <span>Members can download obituaries for free.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">•</span>
                      <span>
                        Non-members can purchase downloads for $10 plus a
                        handling fee.
                      </span>
                    </li>
                  </ul>
                  <p>
                    If you're planning to download multiple obituaries, consider
                    becoming a member! Membership offers great benefits and
                    savings. Learn more about membership options and sign up at{" "}
                    <a
                      href="https://kdgs.ca/membership/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#003B5C] hover:text-green-600 underline"
                    >
                      https://kdgs.ca/membership/
                    </a>
                  </p>
                  <div className="flex justify-center pt-4">
                    <a
                      href="https://kdgs.ca/membership/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-md transition-colors"
                    >
                      Become a Member
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center pt-8">
              <ArrowDown className="h-6 w-6 text-[#003B5C] animate-bounce" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <main className="container mx-auto px-4 -mt-16 relative z-10 mb-20">
        <div className="max-w-4xl mx-auto">
          {/* Tips Section */}
          <div className="mb-8 text-left space-y-6 bg-green-50 p-8 rounded-xl border border-green-200">
            <h3 className="text-xl font-semibold text-green-800 mb-4">
              Tips for Effective Searching
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Finding family members through local obituaries can be rewarding!
              Here's a suggested approach to help you get the best results:
            </p>

            {/* Search Tips Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tip 1: Start with Surname */}
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003B5C] text-white text-sm font-medium">
                    1
                  </div>
                  <h4 className="font-medium text-[#003B5C]">
                    Start with the Surname
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Enter the surname of the deceased person. The search will
                  include maiden names, where given, in the results. If you
                  don't find what you're looking for, try variant spellings
                  (e.g., THOMPSON vs. THOMSON).
                </p>
              </div>

              {/* Tip 2: Add Given Names */}
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003B5C] text-white text-sm font-medium">
                    2
                  </div>
                  <h4 className="font-medium text-[#003B5C]">
                    Add Given Names
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  If you get too many results, add the deceased person's given
                  names to narrow down the search results.
                </p>
              </div>

              {/* Tip 3: Include Relatives */}
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003B5C] text-white text-sm font-medium">
                    3
                  </div>
                  <h4 className="font-medium text-[#003B5C]">
                    Include Relatives
                  </h4>
                </div>
                <p className="text-gray-600 text-sm">
                  Add relatives' surnames and given names to further refine your
                  search, especially useful for common surnames.
                </p>
              </div>

              {/* Tip 4: Use Dates */}
              <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#003B5C] text-white text-sm font-medium">
                    4
                  </div>
                  <h4 className="font-medium text-[#003B5C]">Use Dates</h4>
                </div>
                <p className="text-gray-600 text-sm">
                  If needed, add death or birth information. You can use full or
                  partial dates to narrow down your search.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl shadow-2xl p-8 border border-gray-200">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#003B5C] mb-2">
                Begin Your Search
              </h2>
              <p className="text-gray-600">
                Start by entering the surname of the deceased person you are
                looking for. The search will automatically include maiden names.
                If you get too many results, you can add given names, relatives,
                or life events to narrow down your search.
              </p>
            </div>
            <SearchForm
              // relationships={relationships} // Prop removed
              session={plainSessionData}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
