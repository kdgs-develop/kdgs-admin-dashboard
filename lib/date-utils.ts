/**
 * Date utilities for handling timezone-aware dates and date-only values
 *
 * Content dates (birth, death, publish) should be timezone-independent
 * Metadata dates (entered, edited, proofread) should show in user's timezone
 */

/**
 * Formats a content date (birth, death, publish) as YYYY-MM-DD
 * These dates should appear the same regardless of user timezone
 */
export function formatContentDate(date: Date | null | undefined): string {
  if (!date) return "";

  // For content dates, we want the date as it was entered, not adjusted for timezone
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Formats a metadata timestamp in the user's local timezone with timezone info
 * Shows both the local time and timezone for clarity
 */
export function formatMetadataTimestamp(
  date: Date | null | undefined,
  options: {
    showRelative?: boolean;
    showTimezone?: boolean;
    format?: "short" | "long" | "minimal";
  } = {}
): string {
  if (!date) return "";

  const {
    showRelative = true,
    showTimezone = true,
    format = "short"
  } = options;

  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Show relative time for recent dates
  if (showRelative && diffMs > 0) {
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60)
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  // Format based on requested format
  let formattedDate: string;

  switch (format) {
    case "minimal":
      formattedDate = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
      break;
    case "long":
      formattedDate = d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      break;
    case "short":
    default:
      formattedDate = d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      break;
  }

  // Add timezone info if requested
  if (showTimezone && format !== "minimal") {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const shortTimezone = d
      .toLocaleDateString("en-US", { timeZoneName: "short" })
      .split(", ")[1];
    formattedDate += ` (${shortTimezone})`;
  }

  return formattedDate;
}

/**
 * Parses a date input for content dates (no timezone conversion)
 */
export function parseContentDate(dateString: string): Date | null {
  if (!dateString) return null;

  // For content dates, parse as-is without timezone adjustment
  const parsed = new Date(dateString + "T00:00:00.000Z");
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parses a date input for metadata timestamps (converts to UTC for storage)
 */
export function parseMetadataTimestamp(
  dateInput: Date | string | null
): Date | null {
  if (!dateInput) return null;

  if (typeof dateInput === "string") {
    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return dateInput;
}

/**
 * Gets the current timestamp for metadata fields
 */
export function getCurrentTimestamp(): Date {
  return new Date();
}

/**
 * Formats a date for HTML input[type="date"]
 * Always returns YYYY-MM-DD format regardless of timezone
 */
export function formatForDateInput(date: Date | null | undefined): string {
  if (!date) return "";

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Formats a timestamp for HTML input[type="datetime-local"]
 */
export function formatForDateTimeInput(date: Date | null | undefined): string {
  if (!date) return "";

  // Convert to local timezone for the datetime-local input
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Type guard to check if a field is a metadata timestamp field
 */
export function isMetadataField(fieldName: string): boolean {
  const metadataFields = ["enteredOn", "editedOn", "proofreadDate"];
  return metadataFields.includes(fieldName);
}

/**
 * Type guard to check if a field is a content date field
 */
export function isContentDateField(fieldName: string): boolean {
  const contentDateFields = ["birthDate", "deathDate", "publishDate"];
  return contentDateFields.includes(fieldName);
}
