import Image from "next/image";
import Link from "next/link";
import { SearchForm } from "../components/search-form";
import { SearchResults } from "./components/search-results";
import { Suspense } from "react";
import { ResultsSkeleton } from "./components/results-skeleton";

export const dynamic = "force-dynamic";

interface SearchResultsPageProps {
  searchParams: {
    q?: string;
  };
}

export function generateMetadata({ searchParams }: SearchResultsPageProps) {
  const query = searchParams.q || "";
  return {
    title: `Results for "${query}" | KDGS Obituary Search`,
    description: `Search results for "${query}" in the KDGS obituary database`
  };
}

export default function SearchResultsPage({
  searchParams
}: SearchResultsPageProps) {
  const query = searchParams.q || "";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/public/web-search" className="shrink-0">
              <Image
                src="/kdgs.png"
                alt="KDGS Logo"
                width={120}
                height={48}
                priority
                className="h-12 w-auto"
              />
            </Link>

            <div className="w-full max-w-xl">
              <SearchForm />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-screen-xl mx-auto">
          {!query ? (
            <div className="text-center py-12">
              <h1 className="text-2xl font-medium text-gray-900">
                Please enter a search term
              </h1>
              <p className="mt-2 text-gray-600">
                Enter a given name and/or surname to search for obituaries
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-medium text-gray-900 mb-6">
                Search results for: <span className="italic">"{query}"</span>
              </h1>

              <Suspense fallback={<ResultsSkeleton />}>
                <SearchResults query={query} />
              </Suspense>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 px-4 py-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} KDGS Database - All rights reserved
      </footer>
    </div>
  );
}
