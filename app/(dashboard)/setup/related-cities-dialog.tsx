"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Download } from "lucide-react";
import { getCitiesByCountryId } from "./actions";

interface CityData {
  id: number;
  name: string | null;
  province?: string | null;
}

interface RelatedCitiesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  country: {
    id: number;
    name: string;
  } | null;
}

export function RelatedCitiesDialog({
  isOpen,
  onClose,
  country
}: RelatedCitiesDialogProps) {
  const [cities, setCities] = useState<CityData[]>([]);
  const [cityCount, setCityCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && country) {
      loadCities();
    }
  }, [isOpen, country]);

  const loadCities = async () => {
    if (!country) return;

    try {
      setIsLoading(true);
      const data = await getCitiesByCountryId(country.id);
      setCities(data.cities);
      setCityCount(data.count);
    } catch (error) {
      console.error("Error loading cities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCities([]);
    setCityCount(null);
    onClose();
  };

  const downloadCitiesList = () => {
    if (!cities.length || !country) return;

    // Create formatted content
    const content = [
      `Cities in ${country.name}`,
      `Total: ${cities.length}`,
      "",
      ...cities.map(city => {
        const cityName = city.name || "Unnamed";
        return city.province ? `${cityName}, ${city.province}` : cityName;
      })
    ].join("\n");

    // Create the download link
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${country.name.replace(/\s+/g, "_")}_cities.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cities in {country?.name || ""}</DialogTitle>
          <DialogDescription>
            {cityCount !== null && `Showing ${cityCount} cities.`}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            {cities.length > 0 ? (
              <ScrollArea className="max-h-[300px] pr-4">
                <div className="space-y-2">
                  {cities.map(city => (
                    <div key={city.id} className="p-2 border rounded">
                      <div className="font-medium">
                        {city.name || "Unnamed"}
                      </div>
                      {city.province && (
                        <div className="text-sm text-muted-foreground">
                          {city.province}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No cities found for this country.
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex justify-between items-center w-full">
          {!isLoading && cities.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCitiesList}
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
