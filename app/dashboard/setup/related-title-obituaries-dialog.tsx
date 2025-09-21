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
import { getObituariesByTitleId } from "./actions";
import { format } from "date-fns";

interface ObituaryData {
  id: number;
  reference: string;
  surname: string | null;
  givenNames: string | null;
  birthDate: Date | null;
  deathDate: Date | null;
  title: {
    name: string | null;
  } | null;
}

interface RelatedTitleObituariesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: {
    id: number;
    name: string | null;
  } | null;
}

export function RelatedTitleObituariesDialog({
  isOpen,
  onClose,
  title
}: RelatedTitleObituariesDialogProps) {
  const [obituaries, setObituaries] = useState<ObituaryData[]>([]);
  const [obituaryCount, setObituaryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && title) {
      loadObituaries();
    }
  }, [isOpen, title]);

  const loadObituaries = async () => {
    if (!title) return;

    try {
      setIsLoading(true);
      const data = await getObituariesByTitleId(title.id);
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
    if (!obituaries.length || !title) return;

    // Format title name
    const titleName = title.name || "Unnamed Title";

    // Create formatted content
    const content = [
      `Obituaries with Title: ${titleName}`,
      `Total: ${obituaryCount}`,
      "",
      ...obituaries.map(obituary => {
        const deceasedName = [obituary.givenNames, obituary.surname]
          .filter(Boolean)
          .join(" ");

        // Format dates if available
        const birthDate = obituary.birthDate
          ? format(new Date(obituary.birthDate), "yyyy-MM-dd")
          : "Unknown";

        const deathDate = obituary.deathDate
          ? format(new Date(obituary.deathDate), "yyyy-MM-dd")
          : "Unknown";

        return `${obituary.reference} - ${deceasedName || "Unknown"} (Birth: ${birthDate}, Death: ${deathDate})`;
      })
    ].join("\n\n");

    // Create the download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.name?.replace(/\s+/g, "_") || "title"}_obituaries.txt`;
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
            Obituaries with Title: {title?.name || "Unknown Title"}
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
                      className="p-2 border rounded border-l-4 border-l-blue-300"
                    >
                      <div className="font-medium">
                        {[obituary.givenNames, obituary.surname]
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
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No obituaries found with this title.
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
