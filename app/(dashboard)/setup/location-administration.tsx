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
  LinkIcon
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import {
  addCity,
  deleteCity,
  getCitiesWithPagination,
  getCountries,
  searchCities,
  updateCity,
  getObituariesByCityId
} from "./actions";
import AddLocationDialog from "./add-location-dialog";
import EditLocationDialog from "./edit-location-dialog";
import { RelatedObituariesDialog } from "./related-obituaries-dialog";

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

          // Fetch obituary counts for each city
          await fetchObituaryCounts(result.cities);
        } else {
          const [citiesResult, countriesResult] = await Promise.all([
            getCitiesWithPagination(currentPage),
            getCountries(1, 100)
          ]);
          setCities(citiesResult.cities);
          setTotalPages(citiesResult.totalPages);
          setCountries(countriesResult.countries);

          // Fetch obituary counts for each city
          await fetchObituaryCounts(citiesResult.cities);
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

        // Fetch obituary counts for new data
        await fetchObituaryCounts(result.cities);
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

        // Fetch obituary counts for updated data
        await fetchObituaryCounts(result.cities);
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

        // Fetch obituary counts for updated data
        await fetchObituaryCounts(result.cities);
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

      // Fetch obituary counts for search results
      await fetchObituaryCounts(result.cities);
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

      // Fetch obituary counts for new data
      await fetchObituaryCounts(result.cities);
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          setRelatedCity({
                            id: city.id,
                            name: city.name
                          });
                          setIsRelatedDialogOpen(true);
                        }}
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        {obituaryCounts[city.id] !== undefined ? (
                          <>
                            {obituaryCounts[city.id].birthCount} birth location,{" "}
                            {obituaryCounts[city.id].deathCount} death location
                          </>
                        ) : (
                          "View related entries"
                        )}
                      </Button>
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
        </CardContent>
      )}
    </Card>
  );
}
