"use client";

import { format } from "date-fns";
import { useState } from "react";
import { ObituaryResult } from "../../../types";
import { Button } from "@/components/ui/button";

interface ObituaryResultCardProps {
  obituary: ObituaryResult;
}

export function ObituaryResultCard({ obituary }: ObituaryResultCardProps) {
  const [isRequestingModal, setIsRequestingModal] = useState(false);

  const fullName = [obituary.title?.name, obituary.givenNames, obituary.surname]
    .filter(Boolean)
    .join(" ");

  const deathDate = obituary.deathDate
    ? format(new Date(obituary.deathDate), "MMMM d, yyyy")
    : "Unknown";

  const previewText = obituary.notes
    ? obituary.notes.slice(0, 100) + (obituary.notes.length > 100 ? "..." : "")
    : "No preview available.";

  const canRequestObituary =
    obituary.proofread &&
    (obituary.imageNames?.length > 0 || obituary.fileImages?.length > 0);

  const handleRequestClick = () => {
    if (canRequestObituary) {
      // Redirect to payment page
      window.location.href = `/public/web-search/request/${obituary.publicHash}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-medium text-gray-900 mb-1">{fullName}</h2>

        <p className="text-sm text-gray-500 mb-3">Date of Death: {deathDate}</p>

        {obituary.birthDate && (
          <p className="text-sm text-gray-500 mb-3">
            Birth Date: {format(new Date(obituary.birthDate), "MMMM d, yyyy")}
          </p>
        )}

        <div className="text-gray-700 mb-4">
          <p>{previewText}</p>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleRequestClick}
            disabled={!canRequestObituary}
            className="w-full md:w-auto"
          >
            {canRequestObituary
              ? "Request Obituary"
              : "Obituary Not Available for Request"}
          </Button>

          {!canRequestObituary && (
            <p className="mt-2 text-sm text-gray-500">
              This obituary is not yet available for request. Check back later.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
