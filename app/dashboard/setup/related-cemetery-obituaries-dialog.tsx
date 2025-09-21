"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download, Calendar } from "lucide-react";
import { getObituariesByCemeteryId } from "./actions";
import { format } from "date-fns";

interface ObituaryData {
  id: number;
  reference: string;
  surname: string | null;
  givenNames: string | null;
  birthDate: Date | null;
  deathDate: Date | null;
  burialCemetery: string | null;
  title: {
    name: string | null;
  } | null;
}

interface RelatedCemeteryObituariesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cemetery: {
    id: number;
    name: string | null;
    city?: {
      name: string | null;
      country?: {
        name: string | null;
      } | null;
    } | null;
  } | null;
}

export function RelatedCemeteryObituariesDialog({
  isOpen,
  onClose,
  cemetery
}: RelatedCemeteryObituariesDialogProps) {
  const [obituaries, setObituaries] = useState<ObituaryData[]>([]);
  const [obituaryCount, setObituaryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && cemetery) {
      loadObituaries();
    }
  }, [isOpen, cemetery]);

  const loadObituaries = async () => {
    if (!cemetery) return;

    try {
      setIsLoading(true);
      const data = await getObituariesByCemeteryId(cemetery.id);
      setObituaries(data.obituaries);
      setObituaryCount(data.count);
    } catch (error) {
      console.error("Error loading obituaries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setObituaries([]);
    setObituaryCount(0);
    onClose();
  };

  const downloadObituariesList = () => {
    if (!obituaries.length || !cemetery) return;

    // Format cemetery name
    const cemeteryName = cemetery.name || "Unnamed Cemetery";
    const cityInfo = cemetery.city?.name
      ? `${cemetery.city.name}${cemetery.city.country?.name ? `, ${cemetery.city.country.name}` : ""}`
      : "";
    const cemeteryFullName = cityInfo
      ? `${cemeteryName} (${cityInfo})`
      : cemeteryName;

    // Create formatted content
    const content = [
      `Obituaries Interred at ${cemeteryFullName}`,
      `Total: ${obituaryCount}`,
      "",
      ...obituaries.map(obituary => {
        const deceasedName = [
          obituary.title?.name,
          obituary.givenNames,
          obituary.surname
        ]
          .filter(Boolean)
          .join(" ");

        // Format dates if available
        const birthDate = obituary.birthDate
          ? format(new Date(obituary.birthDate), "yyyy-MM-dd")
          : "Unknown";

        const deathDate = obituary.deathDate
          ? format(new Date(obituary.deathDate), "yyyy-MM-dd")
          : "Unknown";

        // Additional burial information if available
        const burialInfo = obituary.burialCemetery
          ? `\nBurial Details: ${obituary.burialCemetery}`
          : "";

        return `${obituary.reference} - ${deceasedName || "Unknown"} (Birth: ${birthDate}, Death: ${deathDate})${burialInfo}`;
      })
    ].join("\n\n");

    // Create the download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cemetery.name?.replace(/\s+/g, "_") || "cemetery"}_obituaries.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Obituaries at {cemetery?.name || "Unknown Cemetery"}
          </DialogTitle>
          <DialogDescription>
            {obituaryCount > 0 && `Showing ${obituaryCount} obituaries.`}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            {obituaries.length > 0 ? (
              <ScrollArea className="max-h-[300px] pr-4">
                <div className="space-y-2">
                  {obituaries.map(obituary => (
                    <div
                      key={obituary.id}
                      className="p-2 border rounded border-l-4 border-l-green-300"
                    >
                      <div className="font-medium">
                        {[
                          obituary.title?.name,
                          obituary.givenNames,
                          obituary.surname
                        ]
                          .filter(Boolean)
                          .join(" ") || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span>Ref: {obituary.reference}</span>
                        {(obituary.birthDate || obituary.deathDate) && (
                          <div className="flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {obituary.birthDate && (
                              <span>
                                Birth:{" "}
                                {format(
                                  new Date(obituary.birthDate),
                                  "yyyy-MM-dd"
                                )}
                              </span>
                            )}
                            {obituary.birthDate && obituary.deathDate && (
                              <span className="mx-1">|</span>
                            )}
                            {obituary.deathDate && (
                              <span>
                                Death:{" "}
                                {format(
                                  new Date(obituary.deathDate),
                                  "yyyy-MM-dd"
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {obituary.burialCemetery && (
                        <div className="mt-2 pt-2 border-t text-sm">
                          <div className="text-xs text-muted-foreground">
                            Burial Details: {obituary.burialCemetery}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No obituaries found for this interment place.
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex justify-between items-center w-full">
          {!isLoading && obituaries.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadObituariesList}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download List
            </Button>
          ) : (
            <div></div>
          )}
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
