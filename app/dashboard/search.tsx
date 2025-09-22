"use client";

import { Spinner } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchLoading } from "./search-loading-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import { Download, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { forwardRef, useEffect, useRef, useState, useTransition } from "react";

const SEARCH_OPTIONS = [
  { value: "regular", label: "Global Search" },

  { value: "separator-1", label: "── Files & References ──", disabled: true },
  { value: "@fileNumber", label: "File Number" },
  { value: "@fileBox", label: "File Box (YYYY N)" },
  { value: "@batchNumber", label: "Batch Number" },

  { value: "separator-2", label: "── Names ──", disabled: true },
  { value: "@surname", label: "Surname" },
  { value: "@givenNames", label: "Given Names" },
  { value: "@maidenName", label: "Maiden Name" },
  { value: "@aka.surname", label: "Also Known As - Surname" },
  { value: "@aka.otherNames", label: "Also Known As - Other Names" },

  { value: "separator-3", label: "── Locations ──", disabled: true },
  { value: "@birthLocation", label: "Birth Location" },
  { value: "@deathLocation", label: "Death Location" },
  { value: "@generalLocation", label: "Other Location" },
  { value: "@cemetery", label: "Cemetery" },
  { value: "@periodical", label: "Periodical" },

  { value: "separator-4", label: "── Dates ──", disabled: true },
  { value: "@birthDate", label: "Birth Date (YYYY-MM-DD)" },
  { value: "@birthDateFrom", label: "Birth Date Range" },
  { value: "@deathDate", label: "Death Date (YYYY-MM-DD)" },
  { value: "@deathDateFrom", label: "Death Date Range" },
  { value: "@publishDate", label: "Publish Date (YYYY-MM-DD)" },
  { value: "@publishDateFrom", label: "Publish Date Range" },

  { value: "separator-5", label: "── Relatives ──", disabled: true },
  { value: "@relatives.surname", label: "Relative Surname" },
  { value: "@relatives.givenNames", label: "Relative Given Names" },

  { value: "separator-6", label: "── Status ──", disabled: true },
  { value: "@proofreadYes", label: "Proofread" },
  { value: "@proofreadNo", label: "Not Proofread" },
  { value: "@hasImages", label: "Has Images" },
  { value: "@noImages", label: "No Images" },
  { value: "@imagesProofreadYes", label: "Has Images & Proofread" },
  { value: "@imagesProofreadNo", label: "Has Images & Not Proofread" },
  { value: "@noImagesProofreadYes", label: "No Images & Proofread" },
  { value: "@noImagesProofreadNo", label: "No Images & Not Proofread" },

  { value: "separator-7", label: "── Proofread Dates ──", disabled: true },
  { value: "@proofreadDate", label: "Proofread Date (YYYY-MM-DD)" },
  { value: "@proofreadDateFrom", label: "Proofread Date Range" },

  { value: "separator-8", label: "── User Actions ──", disabled: true },
  { value: "@enteredBy", label: "Entered By" },
  { value: "@enteredOn", label: "Entered On (YYYY-MM-DD)" },
  { value: "@enteredOnFrom", label: "Entered On Range" },
  { value: "@editedBy", label: "Edited By" },
  { value: "@editedOn", label: "Edited On (YYYY-MM-DD)" },
  { value: "@editedOnFrom", label: "Edited On Range" }
];

const HighlightedSearchInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ value, ...props }, ref) => {
  const parts = value?.toString().split(" ") || [];
  const command = parts[0].startsWith("@") ? parts[0] : "";

  return (
    <div className="relative w-full">
      <Input
        {...props}
        ref={ref}
        value={value}
        className={cn(
          "w-full rounded-lg bg-background pl-10 min-w-[200px] h-10",
          command && "text-foreground"
        )}
      />
    </div>
  );
});

HighlightedSearchInput.displayName = "HighlightedSearchInput";

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [context, setContext] = useState("obituaries");
  const [searchValue, setSearchValue] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAuth();
  const { isSearchLoading } = useSearchLoading();

  // Use combined loading state (either URL transition or table loading)
  const isLoading = isPending || isSearchLoading;

  useEffect(() => {
    setContext(
      pathname.startsWith("/dashboard/images") ? "images" : "obituaries"
    );
  }, [pathname]);

  function searchAction(formData: FormData) {
    let value = formData.get("q") as string;
    let params = new URLSearchParams(window.location.search);
    params.set("q", value);
    params.set("offset", "0");
    startTransition(() => {
      const baseUrl = context === "images" ? "/dashboard/images" : "/dashboard";
      router.push(`${baseUrl}?${params.toString()}`);
    });
  }

  function handleSearchOptionChange(value: string) {
    if (value === "regular") {
      setSearchValue("");
    } else {
      const dateRangeOptions = [
        "@birthDateFrom",
        "@deathDateFrom",
        "@proofreadDateFrom",
        "@enteredOnFrom",
        "@editedOnFrom",
        "@publishDateFrom"
      ];
      const dateOptions = [
        "@birthDate",
        "@deathDate",
        "@proofreadDate",
        "@enteredOn",
        "@editedOn",
        "@publishDate"
      ];
      const booleanOptions = {
        "@proofreadYes": "@proofread true",
        "@proofreadNo": "@proofread false",
        "@hasImages": "@images true",
        "@noImages": "@images false",
        "@imagesProofreadYes": "@imagesProofread true true",
        "@imagesProofreadNo": "@imagesProofread true false",
        "@noImagesProofreadYes": "@imagesProofread false true",
        "@noImagesProofreadNo": "@imagesProofread false false"
      };

      let newSearchValue = "";
      if (dateRangeOptions.includes(value)) {
        newSearchValue = `${value} YYYY-MM-DD @${value.slice(1, -4)}To YYYY-MM-DD`;
      } else if (dateOptions.includes(value)) {
        newSearchValue = `${value} YYYY-MM-DD`;
      } else if (value in booleanOptions) {
        newSearchValue = booleanOptions[value as keyof typeof booleanOptions];
      } else if (value === "@fileBox") {
        newSearchValue = `${value} YYYY N`;
      } else if (
        value === "@cemetery" ||
        value === "@periodical" ||
        value === "@birthLocation" ||
        value === "@deathLocation" ||
        value === "@generalLocation"
      ) {
        newSearchValue = `${value} `; // Leave space for user input
      } else if (value === "@aka.surname" || value === "@aka.otherNames") {
        newSearchValue = `${value} `; // Leave space for user input
      } else if (
        value === "@relatives.surname" ||
        value === "@relatives.givenNames"
      ) {
        newSearchValue = `${value} `; // Leave space for user input
      } else if (value === "@enteredBy" || value === "@editedBy") {
        newSearchValue = `${value} `; // Leave space for user input
      } else if (value === "@batchNumber") {
        newSearchValue = `${value} `; // Leave space for user input
      } else {
        newSearchValue = `${value} `; // Default case with space for input
      }

      setSearchValue(newSearchValue);

      // Focus the input and move cursor to the end
      if (value !== "regular") {
        setTimeout(() => {
          if (dateOptions.includes(value)) {
            if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.setSelectionRange(
                newSearchValue.length - 10,
                newSearchValue.length
              );
            }
          } else {
            if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.setSelectionRange(
                newSearchValue.length,
                newSearchValue.length
              );
            }
          }
        }, 0);
      }
    }
  }

  const handleDownloadReport = async () => {
    if (!searchValue || !userId) return;

    setIsDownloading(true);
    try {
      const response = await fetch("/api/generate-search-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          searchQuery: searchValue,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const data = await response.json();

      // Create blob from base64 data
      const binaryString = window.atob(data.pdf.split(",")[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const pdfBlob = new Blob([bytes], { type: "application/pdf" });

      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement("a");
      const currentDateTime = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .slice(0, -5);

      pdfLink.href = pdfUrl;
      const sanitizedQuery = searchValue.replace(/@/g, "").replace(/\s+/g, "-");
      pdfLink.download = `kdgs-report-${sanitizedQuery}-${currentDateTime}.pdf`;
      pdfLink.click();
      window.URL.revokeObjectURL(pdfUrl);

      // After successful report generation and download

      toast({
        title: "Download Complete",
        description: "The search results report has been downloaded."
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    const formData = new FormData(e.currentTarget);
    searchAction(formData);
  }

  return (
    <div
      className={cn(
        "relative w-full transition-opacity duration-200",
        isLoading && "opacity-90"
      )}
    >
      <div className="flex flex-col gap-4 p-4 bg-muted/20 rounded-lg border">
        {context === "obituaries" && (
          <div className="w-full">
            <Select
              onValueChange={handleSearchOptionChange}
              disabled={isLoading}
            >
              <SelectTrigger
                className={cn(
                  "w-full h-10 bg-background",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <SelectValue placeholder="Search type..." />
              </SelectTrigger>
              <SelectContent className="min-w-[200px]">
                {SEARCH_OPTIONS.map(option => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={
                      option.disabled
                        ? "font-semibold text-muted-foreground"
                        : ""
                    }
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col md:flex-row gap-2 w-full">
            {/* Search Input - Full width on mobile, flexible on desktop */}
            <div className="relative flex-1 md:min-w-[200px]">
              {isLoading ? (
                <Spinner className="absolute left-3 top-[0.75rem] h-4 w-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-[0.75rem] h-4 w-4 text-muted-foreground" />
              )}
              <HighlightedSearchInput
                ref={inputRef}
                name="q"
                type="search"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder={`Search ${context}...`}
                disabled={isLoading}
              />
            </div>

            {/* Button Group - Stays together and aligned to the right */}
            <div className="flex gap-2 md:flex-shrink-0">
              <Button
                type="submit"
                variant="default"
                disabled={isLoading}
                className={cn(
                  "flex gap-2 items-center justify-center min-w-[100px] h-10 transition-all duration-200",
                  isLoading && "bg-primary/80 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Spinner className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isLoading ? "Searching..." : "Search"}
              </Button>

              <Button
                type="button"
                variant="default"
                onClick={handleDownloadReport}
                disabled={isDownloading || !searchValue}
                className="flex gap-2 items-center justify-center whitespace-nowrap bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 min-w-[120px] h-10"
              >
                {isDownloading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                PDF Report
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
