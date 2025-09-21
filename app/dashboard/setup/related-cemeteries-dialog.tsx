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
import { Loader2, Download, Building, Cross } from "lucide-react";
import { getCemeteriesByCityId } from "./actions";
import { Badge } from "@/components/ui/badge";

interface CemeteryData {
  id: number;
  name: string | null;
  obituaryCount: number;
}

interface RelatedCemeteriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  city: {
    id: number;
    name: string | null;
  } | null;
}

export function RelatedCemeteriesDialog({
  isOpen,
  onClose,
  city
}: RelatedCemeteriesDialogProps) {
  const [cemeteries, setCemeteries] = useState<CemeteryData[]>([]);
  const [cemeteryCount, setCemeteryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && city) {
      loadCemeteries();
    }
  }, [isOpen, city]);

  const loadCemeteries = async () => {
    if (!city) return;

    try {
      setIsLoading(true);
      const data = await getCemeteriesByCityId(city.id);
      setCemeteries(data.cemeteries);
      setCemeteryCount(data.count);
    } catch (error) {
      console.error("Error loading cemeteries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCemeteries([]);
    setCemeteryCount(0);
    onClose();
  };

  const downloadCemeteriesList = () => {
    if (!cemeteries.length || !city) return;

    // Create formatted content
    const content = [
      `Interments Located in ${city.name || "Unknown Location"}`,
      `Total: ${cemeteryCount} interments`,
      "",
      ...cemeteries.map(cemetery => {
        return `${cemetery.name || "Unnamed Interment"} (${cemetery.obituaryCount} obituaries)`;
      })
    ].join("\n");

    // Create the download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${city.name ? city.name.replace(/\s+/g, "_") : "city"}_cemeteries.txt`;
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
            Interments in {city?.name || "Unknown City"}
          </DialogTitle>
          <DialogDescription>
            {cemeteryCount > 0 &&
              `Showing ${cemeteryCount} interments in this location`}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            {cemeteries.length > 0 ? (
              <ScrollArea className="max-h-[300px] pr-4">
                <div className="space-y-2">
                  {cemeteries.map(cemetery => (
                    <div
                      key={cemetery.id}
                      className="p-2 border rounded border-l-4 border-l-purple-300"
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          {cemetery.name || "Unnamed Cemetery"}
                        </div>
                        {cemetery.obituaryCount > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
                          >
                            <Cross className="h-3 w-3 mr-1" />
                            {cemetery.obituaryCount} obituaries
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No interments found in this location.
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex justify-between items-center w-full">
          {!isLoading && cemeteries.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCemeteriesList}
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
