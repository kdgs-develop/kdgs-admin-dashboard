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
import {
  Loader2,
  Download,
  Newspaper,
  ExternalLink,
  FileText
} from "lucide-react";
import { getPeriodicalsByCityId } from "./actions";
import { Badge } from "@/components/ui/badge";

interface PeriodicalData {
  id: number;
  name: string | null;
  url: string | null;
  obituaryCount: number;
}

interface RelatedPeriodicalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  city: {
    id: number;
    name: string | null;
  } | null;
}

export function RelatedPeriodicalsDialog({
  isOpen,
  onClose,
  city
}: RelatedPeriodicalsDialogProps) {
  const [periodicals, setPeriodicals] = useState<PeriodicalData[]>([]);
  const [periodicalCount, setPeriodicalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && city) {
      loadPeriodicals();
    }
  }, [isOpen, city]);

  const loadPeriodicals = async () => {
    if (!city) return;

    try {
      setIsLoading(true);
      const data = await getPeriodicalsByCityId(city.id);
      setPeriodicals(data.periodicals);
      setPeriodicalCount(data.count);
    } catch (error) {
      console.error("Error loading periodicals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPeriodicals([]);
    setPeriodicalCount(0);
    onClose();
  };

  const openPeriodicalUrl = (url: string) => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const downloadPeriodicalsList = () => {
    if (!periodicals.length || !city) return;

    // Create formatted content
    const content = [
      `Publications Located in ${city.name || "Unknown Location"}`,
      `Total: ${periodicalCount} publications`,
      "",
      ...periodicals.map(periodical => {
        const urlInfo = periodical.url ? ` (URL: ${periodical.url})` : "";
        return `${periodical.name || "Unnamed Publication"} - ${periodical.obituaryCount} obituaries${urlInfo}`;
      })
    ].join("\n");

    // Create the download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${city.name ? city.name.replace(/\s+/g, "_") : "city"}_publications.txt`;
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
            Publications in {city?.name || "Unknown City"}
          </DialogTitle>
          <DialogDescription>
            {periodicalCount > 0 &&
              `Showing ${periodicalCount} publications in this location`}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            {periodicals.length > 0 ? (
              <ScrollArea className="max-h-[300px] pr-4">
                <div className="space-y-2">
                  {periodicals.map(periodical => (
                    <div
                      key={periodical.id}
                      className="p-2 border rounded border-l-4 border-l-blue-300"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium flex items-center">
                          <Newspaper className="h-4 w-4 mr-2 text-muted-foreground" />
                          {periodical.name || "Unnamed Publication"}
                        </div>
                        {periodical.obituaryCount > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {periodical.obituaryCount} obituaries
                          </Badge>
                        )}
                      </div>
                      {periodical.url && (
                        <div className="mt-1 text-sm">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-blue-600 flex items-center"
                            onClick={() => openPeriodicalUrl(periodical.url!)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Visit website
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No publications found in this location.
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex justify-between items-center w-full">
          {!isLoading && periodicals.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadPeriodicalsList}
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
