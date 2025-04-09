"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectScrollUpButton,
  SelectScrollDownButton
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Search,
  LinkIcon,
  Building,
  Newspaper
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  addCity,
  deleteCity,
  getCitiesWithPagination,
  getCountries,
  searchCities,
  updateCity,
  getObituariesByCityId,
  getCemeteriesByCityId,
  getPeriodicalsByCityId
} from "./actions";
import AddLocationDialog from "./add-location-dialog";
import EditLocationDialog from "./edit-location-dialog";
import { RelatedObituariesDialog } from "./related-obituaries-dialog";
import { RelatedCemeteriesDialog } from "./related-cemeteries-dialog";
import { RelatedPeriodicalsDialog } from "./related-periodicals-dialog";

export function LocationAdministration() {
  const [cities, setCities] = useState<any[]>([]);
  const [countries, setCountries] = useState<{ id: number; name: string }[]>(
    []
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const [isDataFetched, setIsDataFetched] = useState(false);

  // Search states
  const [searchName, setSearchName] = useState("");
  const [searchProvince, setSearchProvince] = useState("");
  const [searchCountryId, setSearchCountryId] = useState<string | undefined>(
    undefined
  );
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Related obituaries states
  const [relatedCity, setRelatedCity] = useState<{
    id: number;
    name: string | null;
  } | null>(null);
  const [isRelatedDialogOpen, setIsRelatedDialogOpen] = useState(false);
  const [obituaryCounts, setObituaryCounts] = useState<
    Record<
      number,
      {
        birthCount: number;
        deathCount: number;
        totalCount: number;
      }
    >
  >({});

  // Related cemeteries states
  const [cemeteryRelatedCity, setCemeteryRelatedCity] = useState<{
    id: number;
    name: string | null;
  } | null>(null);
  const [isCemeteriesDialogOpen, setIsCemeteriesDialogOpen] = useState(false);
  const [cemeteryCounts, setCemeteryCounts] = useState<Record<number, number>>(
    {}
  );

  // Related periodicals states
  const [periodicalRelatedCity, setPeriodicalRelatedCity] = useState<{
    id: number;
    name: string | null;
  } | null>(null);
  const [isPeriodicalsDialogOpen, setIsPeriodicalsDialogOpen] = useState(false);
  const [periodicalCounts, setPeriodicalCounts] = useState<
    Record<number, number>
  >({});

  const refreshCountries = useCallback(async () => {
    try {
      const updatedCountries = await getCountries(1, 1000);
      setCountries(updatedCountries.countries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch countries",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    // Only run this effect when expanded or when page/search changes while expanded
    if (!isExpanded) return;

    // First expansion - initially fetch data
    async function fetchData() {
      try {
        if (isSearchMode) {
          const result = await searchCities(
            searchName || undefined,
            searchProvince || undefined,
            searchCountryId ? parseInt(searchCountryId) : undefined,
            currentPage
          );
          setCities(result.cities);
          setTotalPages(result.totalPages);

          // Fetch counts for each city
          await fetchObituaryCounts(result.cities);
          await fetchCemeteryCounts(result.cities);
          await fetchPeriodicalCounts(result.cities);
        } else {
          const [citiesResult, countriesResult] = await Promise.all([
            getCitiesWithPagination(currentPage),
            getCountries(1, 100)
          ]);
          setCities(citiesResult.cities);
          setTotalPages(citiesResult.totalPages);
          setCountries(countriesResult.countries);

          // Fetch counts for each city
          await fetchObituaryCounts(citiesResult.cities);
          await fetchCemeteryCounts(citiesResult.cities);
          await fetchPeriodicalCounts(citiesResult.cities);
        }
        setIsDataFetched(true);
      } catch (error) {
        toast({
          title: "Error fetching data",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          variant: "destructive"
        });
      }
    }

    fetchData();
  }, [
    isExpanded,
    currentPage,
    isSearchMode,
    searchName,
    searchProvince,
    searchCountryId,
    toast
  ]);

  const fetchObituaryCounts = async (citiesList: any[]) => {
    try {
      const counts: Record<
        number,
        {
          birthCount: number;
          deathCount: number;
          totalCount: number;
        }
      > = {};

      await Promise.all(
        citiesList.map(async city => {
          if (city.id) {
            const data = await getObituariesByCityId(city.id);
            counts[city.id] = {
              birthCount: data.birthCount,
              deathCount: data.deathCount,
              totalCount: data.totalCount
            };
          }
        })
      );
      setObituaryCounts(counts);
    } catch (error) {
      console.error("Error fetching obituary counts:", error);
    }
  };

  const fetchCemeteryCounts = async (citiesList: any[]) => {
    try {
      const counts: Record<number, number> = {};

      await Promise.all(
        citiesList.map(async city => {
          if (city.id) {
            const data = await getCemeteriesByCityId(city.id);
            counts[city.id] = data.count;
          }
        })
      );
      setCemeteryCounts(counts);
    } catch (error) {
      console.error("Error fetching cemetery counts:", error);
    }
  };

  const fetchPeriodicalCounts = async (citiesList: any[]) => {
    try {
      const counts: Record<number, number> = {};

      await Promise.all(
        citiesList.map(async city => {
          if (city.id) {
            const data = await getPeriodicalsByCityId(city.id);
            counts[city.id] = data.count;
          }
        })
      );
      setPeriodicalCounts(counts);
    } catch (error) {
      console.error("Error fetching periodical counts:", error);
    }
  };

  const handleAddCity = async (
    name: string | null,
    province: string | null,
    countryId: number
  ) => {
    try {
      const newCity = await addCity(name, province, countryId);

      // Only refetch if the component is expanded
      if (isExpanded) {
        const result = await getCitiesWithPagination(1);
        setCities(result.cities);
        setTotalPages(result.totalPages);
        // Reset to page 1 after adding
        setCurrentPage(1);
        setIsSearchMode(false);

        // Fetch counts for new data
        await fetchObituaryCounts(result.cities);
        await fetchCemeteryCounts(result.cities);
        await fetchPeriodicalCounts(result.cities);
      }

      toast({
        title: "Success",
        description: "Location added successfully"
      });
    } catch (error) {
      toast({
        title: "Error adding location",
        description:
          error instanceof Error ? error.message : "Failed to add location",
        variant: "destructive"
      });
    }
  };

  const handleEditCity = async (
    id: number,
    name: string | null,
    province: string | null,
    countryId: number
  ) => {
    try {
      await updateCity(id, name, province, countryId);

      // Only refetch if the component is expanded
      if (isExpanded) {
        const result = await getCitiesWithPagination(currentPage);
        setCities(result.cities);
        setTotalPages(result.totalPages);

        // Fetch counts for updated data
        await fetchObituaryCounts(result.cities);
        await fetchCemeteryCounts(result.cities);
        await fetchPeriodicalCounts(result.cities);
      }

      toast({
        title: "Success",
        description: "Location updated successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedCity(null);
    } catch (error) {
      toast({
        title: "Error updating location",
        description:
          error instanceof Error ? error.message : "Failed to update location",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCity = async (id: number) => {
    try {
      await deleteCity(id);

      // Only refetch if the component is expanded
      if (isExpanded) {
        const result = await getCitiesWithPagination(currentPage);
        setCities(result.cities);
        setTotalPages(result.totalPages);

        // Fetch counts for updated data
        await fetchObituaryCounts(result.cities);
        await fetchCemeteryCounts(result.cities);
        await fetchPeriodicalCounts(result.cities);
      }

      toast({
        title: "Success",
        description: "Location deleted successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedCity(null);
    } catch (error) {
      toast({
        title: "Error deleting location",
        description:
          error instanceof Error ? error.message : "Failed to delete location",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async () => {
    // Only search if expanded
    if (!isExpanded) return;

    try {
      setCurrentPage(1);
      setIsSearchMode(true);
      const result = await searchCities(
        searchName || undefined,
        searchProvince || undefined,
        searchCountryId ? parseInt(searchCountryId) : undefined,
        1
      );
      setCities(result.cities);
      setTotalPages(result.totalPages);

      // Fetch counts for search results
      await fetchObituaryCounts(result.cities);
      await fetchCemeteryCounts(result.cities);
      await fetchPeriodicalCounts(result.cities);
    } catch (error) {
      toast({
        title: "Error searching locations",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleClearSearch = async () => {
    // Only reset if expanded
    if (!isExpanded) return;

    setSearchName("");
    setSearchProvince("");
    setSearchCountryId(undefined);
    setIsSearchMode(false);
    setCurrentPage(1);

    try {
      const result = await getCitiesWithPagination(1);
      setCities(result.cities);
      setTotalPages(result.totalPages);

      // Fetch counts for new data
      await fetchObituaryCounts(result.cities);
      await fetchCemeteryCounts(result.cities);
      await fetchPeriodicalCounts(result.cities);
    } catch (error) {
      toast({
        title: "Error clearing search",
        description: "Could not reset the search results",
        variant: "destructive"
      });
    }
  };

  const handleOpenAddDialog = () => {
    setIsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <CardTitle>Location Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage locations and search records
            </CardDescription>
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
            <div className="flex-1">
              <Input
                placeholder="Search by province"
                value={searchProvince}
                onChange={e => setSearchProvince(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Select
                value={searchCountryId}
                onValueChange={setSearchCountryId}
                onOpenChange={open => {
                  setIsCountryDropdownOpen(open);
                  if (open) {
                    refreshCountries();
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} variant="secondary">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button
              onClick={handleClearSearch}
              variant="outline"
              disabled={
                !isSearchMode &&
                searchName === "" &&
                searchProvince === "" &&
                !searchCountryId
              }
            >
              Reset
            </Button>
            <Button onClick={handleOpenAddDialog} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {!isDataFetched ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : cities.length > 0 ? (
            <>
              <div className="grid gap-2">
                {cities.map(city => (
                  <div
                    key={city.id}
                    className="p-2 border rounded flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">{city.name || ""}</span>
                      {city.province && (
                        <span className="ml-2 text-muted-foreground">
                          {city.province}
                        </span>
                      )}
                      {city.country && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({city.country.name})
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {obituaryCounts[city.id] !== undefined &&
                        obituaryCounts[city.id].totalCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 px-2 text-xs bg-amber-50 hover:bg-amber-100 border-amber-200"
                            onClick={e => {
                              e.stopPropagation();
                              setRelatedCity({
                                id: city.id,
                                name: city.name
                              });
                              setIsRelatedDialogOpen(true);
                            }}
                          >
                            <LinkIcon className="h-3 w-3" />
                            {obituaryCounts[city.id].birthCount} Birth,{" "}
                            {obituaryCounts[city.id].deathCount} Death
                          </Button>
                        )}
                      {cemeteryCounts[city.id] !== undefined &&
                        cemeteryCounts[city.id] > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 px-2 text-xs bg-purple-50 hover:bg-purple-100 border-purple-200"
                            onClick={e => {
                              e.stopPropagation();
                              setCemeteryRelatedCity({
                                id: city.id,
                                name: city.name
                              });
                              setIsCemeteriesDialogOpen(true);
                            }}
                          >
                            <Building className="h-3 w-3" />
                            {cemeteryCounts[city.id]} Interments
                          </Button>
                        )}
                      {periodicalCounts[city.id] !== undefined &&
                        periodicalCounts[city.id] > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 px-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                            onClick={e => {
                              e.stopPropagation();
                              setPeriodicalRelatedCity({
                                id: city.id,
                                name: city.name
                              });
                              setIsPeriodicalsDialogOpen(true);
                            }}
                          >
                            <Newspaper className="h-3 w-3" />
                            {periodicalCounts[city.id]} Publications
                          </Button>
                        )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedCity(city);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end items-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="py-2 px-3 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No locations found
            </div>
          )}

          <AddLocationDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddCity={handleAddCity}
            countries={countries}
            refetchCountries={refreshCountries}
            initialValues={{
              name: searchName,
              province: searchProvince,
              countryId: searchCountryId
            }}
          />

          <EditLocationDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedCity(null);
            }}
            onEditCity={handleEditCity}
            onDeleteCity={handleDeleteCity}
            city={selectedCity}
            countries={countries}
          />

          <RelatedObituariesDialog
            isOpen={isRelatedDialogOpen}
            onClose={() => {
              setIsRelatedDialogOpen(false);
              setRelatedCity(null);
            }}
            city={relatedCity}
          />

          <RelatedCemeteriesDialog
            isOpen={isCemeteriesDialogOpen}
            onClose={() => {
              setIsCemeteriesDialogOpen(false);
              setCemeteryRelatedCity(null);
            }}
            city={cemeteryRelatedCity}
          />

          <RelatedPeriodicalsDialog
            isOpen={isPeriodicalsDialogOpen}
            onClose={() => {
              setIsPeriodicalsDialogOpen(false);
              setPeriodicalRelatedCity(null);
            }}
            city={periodicalRelatedCity}
          />
        </CardContent>
      )}
    </Card>
  );
}
