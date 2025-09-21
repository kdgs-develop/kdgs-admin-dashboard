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
import { Loader2, Download, Newspaper, Calendar } from "lucide-react";
import { getObituariesByPeriodicalId } from "./actions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface ObituaryData {
  id: number;
  reference: string;
  surname: string | null;
  givenNames: string | null;
  publishDate: Date | null;
  page: string | null;
  title: {
    name: string | null;
  } | null;
}

interface RelatedPeriodicalObituariesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  periodical: {
    id: number;
    name: string | null;
  } | null;
}

export function RelatedPeriodicalObituariesDialog({
  isOpen,
  onClose,
  periodical
}: RelatedPeriodicalObituariesDialogProps) {
  const [obituaries, setObituaries] = useState<ObituaryData[]>([]);
  const [obituaryCount, setObituaryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && periodical) {
      loadObituaries();
    }
  }, [isOpen, periodical]);

  const loadObituaries = async () => {
    if (!periodical) return;

    try {
      setIsLoading(true);
      const data = await getObituariesByPeriodicalId(periodical.id);
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
    if (!obituaries.length || !periodical) return;

    // Create formatted content
    const content = [
      `Obituaries Published in ${periodical.name || "Unknown Publication"}`,
      `Total: ${obituaryCount}`,
      "",
      ...obituaries.map(obituary => {
        const name = [
          obituary.title?.name,
          obituary.givenNames,
          obituary.surname
        ]
          .filter(Boolean)
          .join(" ");

        const publishInfo = [
          obituary.publishDate
            ? `Published: ${format(new Date(obituary.publishDate), "yyyy-MM-dd")}`
            : null,
          obituary.page ? `Page: ${obituary.page}` : null
        ]
          .filter(Boolean)
          .join(", ");

        return `${obituary.reference} - ${name || "Unknown"} (${publishInfo || "No publication details"})`;
      })
    ].join("\n");

    // Create the download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${periodical.name ? periodical.name.replace(/\s+/g, "_") : "publication"}_obituaries.txt`;
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
            Obituaries in {periodical?.name || "Unknown Publication"}
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
                      <div className="flex justify-between items-center">
                        <div className="font-medium">
                          {[
                            obituary.title?.name,
                            obituary.givenNames,
                            obituary.surname
                          ]
                            .filter(Boolean)
                            .join(" ") || "Unknown"}
                        </div>
                        <Badge variant="secondary">
                          <Newspaper className="h-3 w-3 mr-1" /> Published
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Ref: {obituary.reference}</span>
                        <span className="flex items-center">
                          {obituary.publishDate && (
                            <>
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(
                                new Date(obituary.publishDate),
                                "yyyy-MM-dd"
                              )}
                              {obituary.page && `, Page ${obituary.page}`}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No obituaries found for this publication.
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
