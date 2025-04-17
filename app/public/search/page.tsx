import { Metadata } from "next";
import { SearchForm } from "./components/search-form";
import { ArrowDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Search Obituary Records - KDGS",
  description:
    "Search through our collection of Central Okanagan obituary records to discover your family history"
};

export default function SearchPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-[#003B5C] py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px]" />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#003B5C]/10 via-[#003B5C]/50 to-[#003B5C]"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black)"
          }}
        />

        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-5xl font-bold text-white tracking-tight">
              Search Obituary Records
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed">
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
      <main className="container mx-auto px-4 -mt-10 relative z-10 mb-20">
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
            <SearchForm />
          </div>

          <div className="mt-12 text-center space-y-8">
            <button className="group text-[#8B0000] hover:text-[#6d0000] font-medium inline-flex items-center gap-2 transition-all">
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
