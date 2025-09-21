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
import { Loader2, Download, Users, Calendar } from "lucide-react";
import { getObituariesByRelationshipId } from "./actions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface RelativeData {
  surname: string | null;
  givenNames: string | null;
  relationship: string | null;
  predeceased: boolean;
}

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
  relatives: RelativeData[];
}

interface RelatedRelationshipObituariesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  relationship: {
    id: string;
    name: string;
    category: string;
  } | null;
}

export function RelatedRelationshipObituariesDialog({
  isOpen,
  onClose,
  relationship
}: RelatedRelationshipObituariesDialogProps) {
  const [obituaries, setObituaries] = useState<ObituaryData[]>([]);
  const [obituaryCount, setObituaryCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && relationship) {
      loadObituaries();
    }
  }, [isOpen, relationship]);

  const loadObituaries = async () => {
    if (!relationship) return;

    try {
      setIsLoading(true);
      const data = await getObituariesByRelationshipId(relationship.id);
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
    if (!obituaries.length || !relationship) return;

    // Create formatted content
    const content = [
      `Obituaries with ${relationship.name} Relationship`,
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

        // Format relatives information
        const relativesList = obituary.relatives
          .map(relative => {
            const relativeName = [relative.givenNames, relative.surname]
              .filter(Boolean)
              .join(" ");

            const relationshipInfo = relative.relationship
              ? relative.relationship
              : relationship.name;

            const deceasedStatus = relative.predeceased ? " (Predeceased)" : "";

            return `  - ${relativeName || "Unnamed"}: ${relationshipInfo}${deceasedStatus}`;
          })
          .join("\n");

        return [
          `${obituary.reference} - ${deceasedName || "Unknown"} (Birth: ${birthDate}, Death: ${deathDate})`,
          `${relationship.name} Relatives:`,
          relativesList
        ].join("\n");
      })
    ].join("\n\n");

    // Create the download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${relationship.name.replace(/\s+/g, "_")}_obituaries.txt`;
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
            Obituaries with {relationship?.name || "Unknown"} Relationship
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
                      className="p-2 border rounded border-l-4 border-l-purple-300"
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
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {obituary.relatives.length} relative
                          {obituary.relatives.length !== 1 ? "s" : ""}
                        </Badge>
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

                      {obituary.relatives.length > 0 && (
                        <div className="mt-2 pt-2 border-t text-sm">
                          <div className="font-medium text-xs text-muted-foreground mb-1">
                            {relationship?.name} Relatives:
                          </div>
                          <div className="space-y-1">
                            {obituary.relatives.map((relative, index) => (
                              <div key={index} className="flex justify-between">
                                <span>
                                  {[relative.givenNames, relative.surname]
                                    .filter(Boolean)
                                    .join(" ") || "Unnamed"}
                                </span>
                                <span className="text-xs">
                                  {relative.predeceased ? "(Predeceased)" : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No obituaries found for this relationship.
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
