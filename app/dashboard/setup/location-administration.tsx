"use client";

import { Button } from "@/components/ui/button";
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  LinkIcon,
  Building,
  Newspaper,
  Loader2
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
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
import { useSharedData } from "./shared-data-context";

export function LocationAdministration() {
  const {
    cities,
    countries,
    refreshCities,
    refreshCountries,
    initializeData,
    isInitialized
  } = useSharedData();

  // Local cities state for pagination and search
  const [localCities, setLocalCities] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
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

  // Loading states for relations
  const [isLoadingObituaryCounts, setIsLoadingObituaryCounts] = useState(false);
  const [isLoadingCemeteryCounts, setIsLoadingCemeteryCounts] = useState(false);
  const [isLoadingPeriodicalCounts, setIsLoadingPeriodicalCounts] =
    useState(false);

  // Add array to track loading city IDs
  const [loadingCityIds, setLoadingCityIds] = useState<number[]>([]);

  // Add local search state separate from the search that's sent to the server
  const [localSearchName, setLocalSearchName] = useState("");
  const [localSearchProvince, setLocalSearchProvince] = useState("");
  const [localSearchCountryId, setLocalSearchCountryId] = useState<
    string | undefined
  >(undefined);

  // Flag to track if we should fetch relations
  const shouldFetchRelations = useRef(false);

  useEffect(() => {
    // Fetch data when component mounts or when dependencies change
    async function fetchData() {
      try {
        if (isSearchMode) {
          const result = await searchCities(
            searchName || undefined,
            searchProvince || undefined,
            searchCountryId ? parseInt(searchCountryId) : undefined,
            currentPage,
            itemsPerPage
          );
          setLocalCities(result.cities);
          setTotalPages(result.totalPages);

          // Only fetch relations when flag is true
          if (shouldFetchRelations.current) {
            await fetchRelationData(result.cities);
            shouldFetchRelations.current = false;
          }
        } else {
          const citiesResult = await getCitiesWithPagination(
            currentPage,
            itemsPerPage
          );
          setLocalCities(citiesResult.cities);
          setTotalPages(citiesResult.totalPages);

          // Only fetch relations when flag is true
          if (shouldFetchRelations.current) {
            await fetchRelationData(citiesResult.cities);
            shouldFetchRelations.current = false;
          }
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

    // Always fetch data when expanded or on page changes
    fetchData();
  }, [
    currentPage,
    itemsPerPage,
    isSearchMode,
    searchName,
    searchProvince,
    searchCountryId,
    toast
  ]);

  // Initialize shared data when component mounts
  useEffect(() => {
    if (!isInitialized) {
      initializeData().catch(error => {
        toast({
          title: "Error",
          description: "Failed to initialize data",
          variant: "destructive"
        });
      });
    }
  }, [isInitialized, initializeData, toast]);

  // Initial load - set flag to fetch relations
  useEffect(() => {
    if (!isDataFetched) {
      shouldFetchRelations.current = true;
    }
  }, [isDataFetched]);

  const fetchRelationData = async (citiesList: any[]) => {
    try {
      // Mark all cities as loading
      setLoadingCityIds(citiesList.map(city => city.id).filter(Boolean));

      // Process each city individually to show results as they come in
      for (const city of citiesList) {
        if (city.id !== undefined && city.id !== null) {
          try {
            // Fetch all three relation types in parallel for each city
            const [obituaryData, cemeteryData, periodicalData] =
              await Promise.all([
                getObituariesByCityId(city.id),
                getCemeteriesByCityId(city.id),
                getPeriodicalsByCityId(city.id)
              ]);

            // Update the counts for this specific city
            setObituaryCounts(prev => ({
              ...prev,
              [city.id]: {
                birthCount: obituaryData.birthCount,
                deathCount: obituaryData.deathCount,
                totalCount: obituaryData.totalCount
              }
            }));

            setCemeteryCounts(prev => ({
              ...prev,
              [city.id]: cemeteryData.count
            }));

            setPeriodicalCounts(prev => ({
              ...prev,
              [city.id]: periodicalData.count
            }));
          } catch (error) {
            console.error(
              `Error fetching relations for city ${city.id}:`,
              error
            );
          } finally {
            // Remove this city from loading state
            setLoadingCityIds(prev => prev.filter(id => id !== city.id));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching relation data:", error);
    }
  };

  const fetchObituaryCounts = async (citiesList: any[]) => {
    try {
      setIsLoadingObituaryCounts(true);
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
          if (city.id !== undefined && city.id !== null) {
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
    } finally {
      setIsLoadingObituaryCounts(false);
    }
  };

  const fetchCemeteryCounts = async (citiesList: any[]) => {
    try {
      setIsLoadingCemeteryCounts(true);
      const counts: Record<number, number> = {};

      await Promise.all(
        citiesList.map(async city => {
          if (city.id !== undefined && city.id !== null) {
            const data = await getCemeteriesByCityId(city.id);
            counts[city.id] = data.count;
          }
        })
      );
      setCemeteryCounts(counts);
    } catch (error) {
      console.error("Error fetching cemetery counts:", error);
    } finally {
      setIsLoadingCemeteryCounts(false);
    }
  };

  const fetchPeriodicalCounts = async (citiesList: any[]) => {
    try {
      setIsLoadingPeriodicalCounts(true);
      const counts: Record<number, number> = {};

      await Promise.all(
        citiesList.map(async city => {
          if (city.id !== undefined && city.id !== null) {
            const data = await getPeriodicalsByCityId(city.id);
            counts[city.id] = data.count;
          }
        })
      );
      setPeriodicalCounts(counts);
    } catch (error) {
      console.error("Error fetching periodical counts:", error);
    } finally {
      setIsLoadingPeriodicalCounts(false);
    }
  };

  const handleAddCity = async (
    name: string | null,
    province: string | null,
    countryId: number
  ) => {
    try {
      const newCity = await addCity(name, province, countryId);

      // Refresh shared cities data
      await refreshCities();

      // Refetch local pagination
      const result = await getCitiesWithPagination(1, itemsPerPage);
      setLocalCities(result.cities);
      setTotalPages(result.totalPages);
      // Reset to page 1 after adding
      setCurrentPage(1);
      setIsSearchMode(false);

      // Fetch counts for new data
      await fetchRelationData(result.cities);

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

      // Refresh shared cities data
      await refreshCities();

      // Refetch local pagination
      const result = await getCitiesWithPagination(currentPage, itemsPerPage);
      setLocalCities(result.cities);
      setTotalPages(result.totalPages);

      // Fetch counts for updated data
      await fetchRelationData(result.cities);

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

      // Refresh shared cities data
      await refreshCities();

      // Refetch local pagination
      const result = await getCitiesWithPagination(currentPage, itemsPerPage);
      setLocalCities(result.cities);
      setTotalPages(result.totalPages);

      // Fetch counts for updated data
      await fetchRelationData(result.cities);

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
    // Update the actual search parameters from local state
    setSearchName(localSearchName);
    setSearchProvince(localSearchProvince);
    setSearchCountryId(localSearchCountryId);
    setCurrentPage(1);
    setIsSearchMode(true);

    // Set flag to fetch relations on next render
    shouldFetchRelations.current = true;

    try {
      const result = await searchCities(
        localSearchName || undefined,
        localSearchProvince || undefined,
        localSearchCountryId ? parseInt(localSearchCountryId) : undefined,
        1,
        itemsPerPage
      );
      setLocalCities(result.cities);
      setTotalPages(result.totalPages);

      // Fetch relations inline for immediate response
      await fetchRelationData(result.cities);

      // Reset flag since we've fetched
      shouldFetchRelations.current = false;
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
    // Reset both local and actual search state
    setLocalSearchName("");
    setLocalSearchProvince("");
    setLocalSearchCountryId(undefined);
    setSearchName("");
    setSearchProvince("");
    setSearchCountryId(undefined);
    setIsSearchMode(false);
    setCurrentPage(1);

    // Set flag to fetch relations on next render
    shouldFetchRelations.current = true;

    try {
      const result = await getCitiesWithPagination(1, itemsPerPage);
      setLocalCities(result.cities);
      setTotalPages(result.totalPages);

      // Fetch relations inline for immediate response
      await fetchRelationData(result.cities);

      // Reset flag since we've fetched
      shouldFetchRelations.current = false;
    } catch (error) {
      toast({
        title: "Error clearing search",
        description: "Could not reset the search results",
        variant: "destructive"
      });
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to page 1 when changing items per page

    // Set flag to fetch relations for the new set of items
    shouldFetchRelations.current = true;
  };

  const handleOpenAddDialog = () => {
    setIsDialogOpen(true);
  };

  // Add a function to handle page changes
  const handlePageChange = (newPage: number) => {
    // Set the flag to fetch relations for the new page
    shouldFetchRelations.current = true;
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name"
            value={localSearchName}
            onChange={e => setLocalSearchName(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            placeholder="Search by province"
            value={localSearchProvince}
            onChange={e => setLocalSearchProvince(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Select
            value={localSearchCountryId}
            onValueChange={setLocalSearchCountryId}
            onOpenChange={open => {
              setIsCountryDropdownOpen(open);
              if (open) {
                refreshCountries().catch(error => {
                  toast({
                    title: "Error",
                    description: "Failed to refresh countries",
                    variant: "destructive"
                  });
                });
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
            localSearchName === "" &&
            localSearchProvince === "" &&
            !localSearchCountryId
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
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : localCities.length > 0 ? (
        <>
          <div className="grid gap-2">
            {localCities.map(city => (
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
                  {/* Show loading state for relations */}
                  {loadingCityIds.includes(city.id) && (
                    <span className="text-xs text-muted-foreground flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Loading relations...
                    </span>
                  )}

                  {/* Only show relation buttons when not loading */}
                  {!loadingCityIds.includes(city.id) &&
                    city.id !== undefined &&
                    city.id !== null &&
                    obituaryCounts[city.id] !== undefined &&
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
                  {!loadingCityIds.includes(city.id) &&
                    city.id !== undefined &&
                    city.id !== null &&
                    cemeteryCounts[city.id] !== undefined &&
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
                  {!loadingCityIds.includes(city.id) &&
                    city.id !== undefined &&
                    city.id !== null &&
                    periodicalCounts[city.id] !== undefined &&
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
          <div className="flex justify-between items-center">
            <div>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
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
                  handlePageChange(Math.min(currentPage + 1, totalPages))
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
          name: localSearchName,
          province: localSearchProvince,
          countryId: localSearchCountryId
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
    </div>
  );
}
