import { Metadata } from "next";
import { SearchForm } from "./components/search-form";
import { ArrowDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FamilyRelationship } from "@prisma/client";

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
  const relationships = await getFamilyRelationships();

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
            <SearchForm relationships={relationships} />
          </div>

          {/* Tips Section */}
          <div className="mt-12 text-center space-y-8">
            <button className="group text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-2 transition-all">
              <span>TIPS FOR EFFECTIVE SEARCHES</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>

            {/* Search Tips Preview */}
            <div className="grid md:grid-cols-3 gap-6 text-left">
              {[
                {
                  title: "Use Name Variations",
                  description:
                    "Try different spellings and nicknames when searching"
                },
                {
                  title: "Narrow by Date",
                  description:
                    "Add birth or death years to find more specific matches"
                },
                {
                  title: "Include Places",
                  description: "Search with locations to find relevant records"
                }
              ].map((tip, i) => (
                <div
                  key={i}
                  className="bg-gray-50 p-6 rounded-xl border border-gray-100"
                >
                  <h3 className="font-medium text-[#003B5C] mb-2">
                    {tip.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
