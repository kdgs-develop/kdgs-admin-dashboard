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
import { Loader2, Download, Baby, Calendar, MapPin } from "lucide-react";
import { getObituariesByCityId } from "./actions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
  relationType: "birth" | "death";
}

interface RelatedObituariesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  city: {
    id: number;
    name: string | null;
  } | null;
}

export function RelatedObituariesDialog({
  isOpen,
  onClose,
  city
}: RelatedObituariesDialogProps) {
  const [obituaries, setObituaries] = useState<ObituaryData[]>([]);
  const [birthCount, setBirthCount] = useState<number>(0);
  const [deathCount, setDeathCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && city) {
      loadObituaries();
    }
  }, [isOpen, city]);

  const loadObituaries = async () => {
    if (!city) return;

    try {
      setIsLoading(true);
      const data = await getObituariesByCityId(city.id);
      setObituaries(data.obituaries);
      setBirthCount(data.birthCount);
      setDeathCount(data.deathCount);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Error loading obituaries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setObituaries([]);
    setBirthCount(0);
    setDeathCount(0);
    setTotalCount(0);
    onClose();
  };

  const downloadObituariesList = () => {
    if (!obituaries.length || !city) return;

    // Create formatted content
    const content = [
      `Obituary Entries Related to ${city.name || "Unknown City"}`,
      `Total Entries: ${totalCount} (${birthCount} birth location, ${deathCount} death location)`,
      "",
      ...obituaries.map(obituary => {
        const name = [
          obituary.title?.name,
          obituary.givenNames,
          obituary.surname
        ]
          .filter(Boolean)
          .join(" ");

        let relationInfo = "";
        let dateInfo = "";

        if (obituary.relationType === "birth") {
          relationInfo = "Birth Location";
          if (obituary.birthDate) {
            dateInfo = `Birth: ${format(new Date(obituary.birthDate), "yyyy-MM-dd")}`;
          }
        } else {
          relationInfo = "Death Location";
          if (obituary.deathDate) {
            dateInfo = `Death: ${format(new Date(obituary.deathDate), "yyyy-MM-dd")}`;
          }
        }

        return `${obituary.reference} - ${name || "Unknown"} (${relationInfo}, ${dateInfo || "No date information"})`;
      })
    ].join("\n");

    // Create the download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${city.name ? city.name.replace(/\s+/g, "_") : "city"}_obituary_entries.txt`;
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
            Obituary Entries for {city?.name || "Unknown City"}
          </DialogTitle>
          <DialogDescription>
            {totalCount > 0 &&
              `Showing ${totalCount} entries (${birthCount} birth location, ${deathCount} death location)`}
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
                      key={`${obituary.id}-${obituary.relationType}`}
                      className={`p-2 border rounded ${
                        obituary.relationType === "birth"
                          ? "border-l-4 border-l-blue-300"
                          : "border-l-4 border-l-amber-300"
                      }`}
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
                        <Badge
                          variant={
                            obituary.relationType === "birth"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {obituary.relationType === "birth" ? (
                            <>
                              <Baby className="h-3 w-3 mr-1" /> Birth Location
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3 mr-1" /> Death Location
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground mt-1">
                        <span>Ref: {obituary.reference}</span>
                        <span>
                          {obituary.relationType === "birth" ? (
                            obituary.birthDate ? (
                              <>
                                {format(
                                  new Date(obituary.birthDate),
                                  "yyyy-MM-dd"
                                )}
                              </>
                            ) : (
                              "No birth date"
                            )
                          ) : obituary.deathDate ? (
                            <>
                              {format(
                                new Date(obituary.deathDate),
                                "yyyy-MM-dd"
                              )}
                            </>
                          ) : (
                            "No death date"
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No obituary entries found for this location.
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
