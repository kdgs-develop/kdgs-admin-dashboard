"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { SearchResult } from "@/lib/actions/public-search/search-obituaries";
import {
  AlertCircle,
  ShoppingCart,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Helper function to format dates using UTC
function formatDate(date: Date | null): string {
  if (!date) return "-";
  // Use UTC timezone for consistent date display
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC" // Explicitly use UTC
  });
}

interface SearchResultsProps {
  results: SearchResult[] | null;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  // Pagination props
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onOpenRequestDialog: (obituaryRef: string, obituaryName: string) => void;
  isLoggedIn: boolean;
  isPartialMatch?: boolean;
}

export function SearchResults({
  results,
  isLoading,
  error,
  hasSearched,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onOpenRequestDialog,
  isLoggedIn,
  isPartialMatch
}: SearchResultsProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const pageSizes = [10, 25, 50, 100];

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#003B5C]" />
        <p className="ml-4 text-lg text-gray-600">Searching...</p>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <Alert variant="destructive" className="mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Search Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // --- No Search Yet State ---
  if (!hasSearched) {
    return null; // Don't show anything before the first search
  }

  // --- No Results State ---
  if (!results || results.length === 0) {
    return (
      <Alert className="mt-8 bg-blue-50 border-blue-200 text-blue-800">
        <ShoppingCart className="h-4 w-4 text-blue-600" />
        <AlertTitle>No Results Found</AlertTitle>
        <AlertDescription>
        Try broadening your search criteria or check for variant spellings in the
        surname (e.g., READ vs. REID).
        </AlertDescription>
      </Alert>
    );
  }

  // --- Results Found State ---
  return (
    <div className="mt-8 space-y-4">
      {/* Partial Match Indicator (Restored) */}
      {isPartialMatch && (
        <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Partial Matches Found</AlertTitle>
          <AlertDescription>
            No exact matches found for all criteria. Showing results based on
            deceased subject fields only.
          </AlertDescription>
        </Alert>
      )}

      {/* Results Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[200px] text-[#003B5C]">
                Given Name(s)
              </TableHead>
              <TableHead className="text-[#003B5C]">Surname</TableHead>
              <TableHead className="text-[#003B5C]">Maiden Name</TableHead>
              <TableHead className="text-[#003B5C] w-[120px]">
                Birth Date
              </TableHead>
              <TableHead className="text-[#003B5C] w-[120px]">
                Death Date
              </TableHead>
              <TableHead className="w-[100px] text-right text-[#003B5C]">
                {isLoggedIn ? "Download" : "Request"}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map(result => {
              // Construct full name for the dialog
              const givenNames = result.givenNames || "";
              const surname = result.surname || "";
              let obituaryName = `${givenNames} ${surname}`.trim();
              if (!obituaryName) {
                obituaryName = `Record ${result.reference}`; // Fallback name
              }

              // Determine button title and SR text based on login status
              const buttonTitle = isLoggedIn
                ? "Download Record"
                : "Add to Cart";
              const srText = isLoggedIn ? "Download Record" : "Add to Cart";

              return (
                <TableRow key={result.reference}>
                  <TableCell className="font-medium">
                    {result.givenNames || "-"}
                  </TableCell>
                  <TableCell>{result.surname || "-"}</TableCell>
                  <TableCell>{result.maidenName || "-"}</TableCell>
                  <TableCell>{formatDate(result.birthDate)}</TableCell>
                  <TableCell>{formatDate(result.deathDate)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      title={buttonTitle}
                      onClick={() =>
                        onOpenRequestDialog(result.reference, obituaryName)
                      }
                      className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                    >
                      {isLoggedIn ? (
                        <Download className="h-4 w-4" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                      <span className="sr-only">{srText}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} -
          {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
        </div>

        <div className="flex items-center gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={value => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizes.map(size => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
