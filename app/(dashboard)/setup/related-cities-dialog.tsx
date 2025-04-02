"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { getCitiesByCountryId } from "./actions";

interface CityData {
  id: number;
  name: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [showCities, setShowCities] = useState(false);

  const loadCities = async () => {
    if (!country) return;

    try {
      setIsLoading(true);
      const data = await getCitiesByCountryId(country.id);
      setCities(data.cities);
      setCityCount(data.count);
      setShowCities(true);
    } catch (error) {
      console.error("Error loading cities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowCities(false);
    setCities([]);
    setCityCount(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Related Cities for {country?.name || ""}</DialogTitle>
          <DialogDescription>
            {!showCities &&
              !isLoading &&
              cityCount === null &&
              "Click 'Show Cities' to view all cities related to this country."}
            {cityCount !== null &&
              `This country has ${cityCount} related cities.`}
            {isLoading && "Loading city data..."}
          </DialogDescription>
        </DialogHeader>

        {!showCities && !isLoading && (
          <div className="flex justify-center py-4">
            <Button onClick={loadCities}>Show Cities</Button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {showCities && cities.length > 0 && (
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-2">
              {cities.map(city => (
                <div key={city.id} className="p-2 border rounded">
                  <div className="font-medium">{city.name || "Unnamed"}</div>
                  {city.province && (
                    <div className="text-sm text-muted-foreground">
                      {city.province}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {showCities && cities.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No cities found for this country.
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
