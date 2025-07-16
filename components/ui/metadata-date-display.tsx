"use client";

import { formatMetadataTimestamp } from "@/lib/date-utils";
import { Clock, Calendar } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface MetadataDateDisplayProps {
  date: Date | null | undefined;
  label?: string;
  showIcon?: boolean;
  showRelative?: boolean;
  showTimezone?: boolean;
  format?: "short" | "long" | "minimal";
  className?: string;
}

export function MetadataDateDisplay({
  date,
  label,
  showIcon = false,
  showRelative = true,
  showTimezone = true,
  format = "short",
  className = ""
}: MetadataDateDisplayProps) {
  if (!date) {
    return (
      <span className={`text-muted-foreground ${className}`}>
        {label && `${label}: `}Not set
      </span>
    );
  }

  const formattedDate = formatMetadataTimestamp(date, {
    showRelative,
    showTimezone,
    format
  });

  const detailedDate = formatMetadataTimestamp(date, {
    showRelative: false,
    showTimezone: true,
    format: "long"
  });

  const content = (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {showIcon && <Clock className="h-3 w-3 text-muted-foreground" />}
      {label && <span className="text-muted-foreground">{label}:</span>}
      <span>{formattedDate}</span>
    </span>
  );

  // If we're showing relative time, provide a tooltip with the exact timestamp
  if (
    (showRelative && formattedDate.includes("ago")) ||
    formattedDate === "Just now"
  ) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-medium">Exact time:</div>
              <div>{detailedDate}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

interface MetadataDateFieldProps {
  date: Date | null | undefined;
  label: string;
  isDisabled?: boolean;
  showAsCard?: boolean;
  className?: string;
}

/**
 * Specialized component for displaying metadata date fields in forms
 * Shows proper timezone information and relative time when appropriate
 */
export function MetadataDateField({
  date,
  label,
  isDisabled = true,
  showAsCard = false,
  className = ""
}: MetadataDateFieldProps) {
  const content = (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div
        className={`
        ${showAsCard ? "p-2 border rounded-md bg-muted/50" : ""}
        ${isDisabled ? "opacity-75" : ""}
      `}
      >
        <MetadataDateDisplay
          date={date}
          showRelative={true}
          showTimezone={true}
          format="short"
          className="text-sm"
        />
        {date && (
          <div className="text-xs text-muted-foreground mt-1">
            <MetadataDateDisplay
              date={date}
              showRelative={false}
              showTimezone={true}
              format="minimal"
            />
          </div>
        )}
      </div>
    </div>
  );

  return content;
}
