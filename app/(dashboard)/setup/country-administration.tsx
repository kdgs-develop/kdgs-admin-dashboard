"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Edit,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LinkIcon
} from "lucide-react";
import {
  getCountries,
  addCountry,
  searchCountries,
  updateCountry,
  deleteCountry,
  getCitiesByCountryId
} from "./actions";
import { Input } from "@/components/ui/input";
import AddCountryDialog from "./add-country-dialog";
import EditCountryDialog from "./edit-country-dialog";
import { RelatedCitiesDialog } from "./related-cities-dialog";

interface CountryData {
  countries: { id: number; name: string }[];
  totalCount: number;
  totalPages: number;
}

export function CountryAdministration() {
  const [countryData, setCountryData] = useState<CountryData>({
    countries: [],
    totalCount: 0,
    totalPages: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [relatedCountry, setRelatedCountry] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [isRelatedDialogOpen, setIsRelatedDialogOpen] = useState(false);
  const [cityCounts, setCityCounts] = useState<Record<number, number>>({});

  const fetchCountries = async (page: number) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const data = await getCountries(page, itemsPerPage);
      setCountryData(data);
      setIsDataFetched(true);

      // Fetch city counts for each country
      const counts: Record<number, number> = {};
      await Promise.all(
        data.countries.map(async country => {
          const cityData = await getCitiesByCountryId(country.id);
          counts[country.id] = cityData.count;
        })
      );
      setCityCounts(counts);
    } catch (error) {
      toast({
        title: "Error fetching countries",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded && (currentPage > 1 || !isDataFetched)) {
      fetchCountries(currentPage);
    }
  }, [currentPage, isExpanded]);

  const handleSearch = async () => {
    if (!isExpanded) return;

    setIsLoading(true);
    try {
      if (!searchName) {
        await fetchCountries(1);
        setCurrentPage(1);
      } else {
        const results = await searchCountries(searchName, 1, itemsPerPage);
        setCountryData(results);
        setCurrentPage(1);

        // Also fetch city counts for search results
        const counts: Record<number, number> = {};
        await Promise.all(
          results.countries.map(async country => {
            const cityData = await getCitiesByCountryId(country.id);
            counts[country.id] = cityData.count;
          })
        );
        setCityCounts(counts);

        if (results.totalCount === 0) {
          toast({
            title: "No results found",
            description: `No countries found matching "${searchName}"`
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error searching countries",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCountry = async (name: string) => {
    try {
      const newCountry = await addCountry(name);
      toast({
        title: "Success",
        description: "Country added successfully"
      });
      if (isExpanded) {
        await fetchCountries(1);
        setCurrentPage(1);
      }
    } catch (error) {
      toast({
        title: "Error adding country",
        description:
          error instanceof Error ? error.message : "Failed to add country",
        variant: "destructive"
      });
    }
  };

  const handleEditCountry = async (name: string) => {
    if (!selectedCountry) return;

    try {
      await updateCountry(selectedCountry.id, name);
      toast({
        title: "Success",
        description: "Country updated successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedCountry(null);
      if (isExpanded) {
        fetchCountries(currentPage);
      }
    } catch (error) {
      toast({
        title: "Error updating country",
        description:
          error instanceof Error ? error.message : "Failed to update country",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCountry = async (id: number) => {
    if (!selectedCountry) return;

    try {
      await deleteCountry(id);
      toast({
        title: "Success",
        description: "Country deleted successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedCountry(null);
      if (isExpanded) {
        fetchCountries(currentPage);
      }
    } catch (error) {
      toast({
        title: "Error deleting country",
        description:
          error instanceof Error ? error.message : "Failed to delete country",
        variant: "destructive"
      });
    }
  };

  const handleToggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // If expanding and no data has been fetched yet, fetch data
    if (newExpandedState && !isDataFetched) {
      fetchCountries(currentPage);
    }
  };

  const handleClearSearch = async () => {
    if (!isExpanded) return;

    setSearchName("");
    await fetchCountries(1);
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={handleToggleExpand}
      >
        <div>
          <CardTitle>Country Management</CardTitle>
          {!isExpanded && (
            <CardDescription>Click to manage countries</CardDescription>
          )}
        </div>
        <Button variant="ghost" size="icon">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSearch}
              variant="secondary"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
            <Button
              onClick={handleClearSearch}
              variant="outline"
              disabled={isLoading || !searchName.trim()}
            >
              Reset
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {isLoading && countryData.countries.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : countryData.countries.length > 0 ? (
            <>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Found Countries:</h3>
                <div className="space-y-2">
                  {countryData.countries.map(country => (
                    <div
                      key={country.id}
                      className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                    >
                      <span className="text-sm">{country.name}</span>
                      <div className="flex items-center gap-2">
                        {cityCounts[country.id] > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 px-2 text-xs bg-slate-50 hover:bg-slate-100 border-slate-200"
                            onClick={e => {
                              e.stopPropagation();
                              setRelatedCountry(country);
                              setIsRelatedDialogOpen(true);
                            }}
                          >
                            <LinkIcon className="h-3 w-3" />
                            {cityCounts[country.id]} Locations
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedCountry(country);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="py-2 px-3 text-sm">
                  Page {currentPage} of {countryData.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(prev =>
                      Math.min(prev + 1, countryData.totalPages)
                    )
                  }
                  disabled={
                    currentPage === countryData.totalPages ||
                    countryData.totalPages === 0 ||
                    isLoading
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : !isLoading && isDataFetched ? (
            <div className="py-8 text-center text-muted-foreground">
              No countries found
            </div>
          ) : null}

          <AddCountryDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddCountry={handleAddCountry}
            initialName={searchName}
          />

          <EditCountryDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedCountry(null);
            }}
            onEditCountry={handleEditCountry}
            onDeleteCountry={handleDeleteCountry}
            country={selectedCountry}
          />

          <RelatedCitiesDialog
            isOpen={isRelatedDialogOpen}
            onClose={() => {
              setIsRelatedDialogOpen(false);
              setRelatedCountry(null);
            }}
            country={relatedCountry}
          />
        </CardContent>
      )}
    </Card>
  );
}
