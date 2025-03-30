import { getObituariesByName } from "@/app/public/web-search/lib/actions";
import { ObituaryResult } from "../../../types";
import { ObituaryResultCard } from "./obituary-result-card";

interface SearchResultsProps {
  query: string;
}

export async function SearchResults({ query }: SearchResultsProps) {
  const results = await getObituariesByName(query);

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          No results found
        </h2>
        <p className="text-gray-600">
          No obituaries found for this search. Try adjusting your terms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Found {results.length} obituar{results.length === 1 ? "y" : "ies"}
      </p>

      {results.map(obituary => (
        <ObituaryResultCard key={obituary.id} obituary={obituary} />
      ))}
    </div>
  );
}
