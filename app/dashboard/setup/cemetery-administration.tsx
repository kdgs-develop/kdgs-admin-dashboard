"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  addCemetery,
  deleteCemetery,
  getCemeteriesWithPagination,
  getCities,
  searchCemeteries,
  updateCemetery,
  getObituariesByCemeteryId
} from "./actions";
import { AddCemeteryDialog } from "./add-cemetery-dialog";
import { EditCemeteryDialog } from "./edit-cemetery-dialog";
import { RelatedCemeteryObituariesDialog } from "./related-cemetery-obituaries-dialog";
import { Badge } from "@/components/ui/badge";
import { useSharedData } from "./shared-data-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// Add this type for better type safety
type City = {
  id?: number | null;
  name?: string | null;
  country?: { name: string } | null;
} | null;

export function CemeteryAdministration() {
  const { cities, formattedCities, initializeData, isInitialized } =
    useSharedData();
  const [cemeteries, setCemeteries] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCemetery, setSelectedCemetery] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const { toast } = useToast();

  // Search states
  const [searchName, setSearchName] = useState("");
  const [searchCityId, setSearchCityId] = useState<string | undefined>(
    undefined
  );

  const [openCitySelect, setOpenCitySelect] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  // Obituary states
  const [obituaryCounts, setObituaryCounts] = useState<Record<number, number>>(
    {}
  );
  const [loadingRelationIds, setLoadingRelationIds] = useState<number[]>([]);
  const [isRelatedDialogOpen, setIsRelatedDialogOpen] = useState(false);
  const [relatedCemetery, setRelatedCemetery] = useState<any>(null);

  async function fetchData() {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const cemeteriesResult = await getCemeteriesWithPagination(
        currentPage,
        itemsPerPage
      );
      setCemeteries(cemeteriesResult.cemeteries);
      setTotalPages(cemeteriesResult.totalPages);
      setIsDataFetched(true);

      if (cemeteriesResult.cemeteries.length > 0) {
        fetchObituaryCounts(cemeteriesResult.cemeteries);
      }
    } catch (error) {
      toast({
        title: "Error fetching data",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const fetchObituaryCounts = async (cemeteriesList: any[]) => {
    // Mark all cemeteries as loading
    setLoadingRelationIds(cemeteriesList.map(cemetery => cemetery.id));

    // Process each cemetery individually to show results as they come in
    for (const cemetery of cemeteriesList) {
      try {
        const result = await getObituariesByCemeteryId(cemetery.id);

        // Update the count for this specific cemetery
        setObituaryCounts(prev => ({
          ...prev,
          [cemetery.id]: result.count
        }));
      } catch (error) {
        console.error(
          `Error fetching count for cemetery ${cemetery.id}:`,
          error
        );

        // Set count to 0 on error
        setObituaryCounts(prev => ({
          ...prev,
          [cemetery.id]: 0
        }));
      } finally {
        // Remove this cemetery from loading state
        setLoadingRelationIds(prev => prev.filter(id => id !== cemetery.id));
      }
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchData();
    }
  }, [currentPage, itemsPerPage, isExpanded]);

  // Initialize shared data when component expands
  useEffect(() => {
    if (isExpanded && !isInitialized) {
      initializeData().catch(error => {
        toast({
          title: "Error",
          description: "Failed to initialize shared data",
          variant: "destructive"
        });
      });
    }
  }, [isExpanded, isInitialized, initializeData, toast]);

  // Safe filtering effect
  useEffect(() => {
    if (!Array.isArray(cities)) {
      setFilteredCities([]);
      return;
    }

    if (citySearch) {
      setFilteredCities(
        cities.filter(city => {
          if (!city) return false;
          const cityName = (city?.name ?? "").toLowerCase();
          const countryName = (city?.country?.name ?? "").toLowerCase();
          const searchTerm = citySearch.toLowerCase();
          return (
            cityName.includes(searchTerm) || countryName.includes(searchTerm)
          );
        })
      );
    } else {
      setFilteredCities(cities);
    }
  }, [citySearch, cities]);

  const handleAddCemetery = async (name: string | null, cityId: number) => {
    try {
      await addCemetery(name, cityId);

      if (isExpanded) {
        const result = await getCemeteriesWithPagination(
          currentPage,
          itemsPerPage
        );
        setCemeteries(result.cemeteries);
        setTotalPages(result.totalPages);
        fetchObituaryCounts(result.cemeteries);
      }

      toast({
        title: "Success",
        description: "Cemetery added successfully"
      });
    } catch (error) {
      toast({
        title: "Error adding cemetery",
        description:
          error instanceof Error ? error.message : "Failed to add cemetery",
        variant: "destructive"
      });
    }
  };

  const handleEditCemetery = async (
    id: number,
    name: string | null,
    cityId: number
  ) => {
    try {
      await updateCemetery(id, name, cityId);

      if (isExpanded) {
        const result = await getCemeteriesWithPagination(
          currentPage,
          itemsPerPage
        );
        setCemeteries(result.cemeteries);
        setTotalPages(result.totalPages);
        fetchObituaryCounts(result.cemeteries);
      }

      toast({
        title: "Success",
        description: "Cemetery updated successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedCemetery(null);
    } catch (error) {
      toast({
        title: "Error updating cemetery",
        description:
          error instanceof Error ? error.message : "Failed to update cemetery",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCemetery = async (id: number) => {
    try {
      await deleteCemetery(id);

      if (isExpanded) {
        const result = await getCemeteriesWithPagination(
          currentPage,
          itemsPerPage
        );
        setCemeteries(result.cemeteries);
        setTotalPages(result.totalPages);
        fetchObituaryCounts(result.cemeteries);
      }

      toast({
        title: "Success",
        description: "Cemetery deleted successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedCemetery(null);
    } catch (error) {
      toast({
        title: "Error deleting cemetery",
        description:
          error instanceof Error ? error.message : "Failed to delete cemetery",
        variant: "destructive"
      });
    }
  };

  const handleSearch = async () => {
    if (!isExpanded) return;

    try {
      setIsLoading(true);
      const result = await searchCemeteries(
        searchName || undefined,
        searchCityId ? parseInt(searchCityId) : undefined,
        1, // Always start at page 1 when searching
        itemsPerPage
      );
      setCemeteries(result.cemeteries);
      setTotalPages(result.totalPages);
      setCurrentPage(1); // Reset current page to 1

      if (result.cemeteries.length > 0) {
        fetchObituaryCounts(result.cemeteries);
      } else {
        setObituaryCounts({});
      }
    } catch (error) {
      toast({
        title: "Error searching cemeteries",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // If expanding and data hasn't been fetched yet, we'll let the useEffect trigger the fetch
  };

  const handleClearSearch = async () => {
    if (!isExpanded) return;

    setSearchName("");
    setSearchCityId(undefined);

    try {
      setIsLoading(true);
      const result = await getCemeteriesWithPagination(1, itemsPerPage);
      setCemeteries(result.cemeteries);
      setTotalPages(result.totalPages);
      setCurrentPage(1); // Reset to page 1

      if (result.cemeteries.length > 0) {
        fetchObituaryCounts(result.cemeteries);
      } else {
        setObituaryCounts({});
      }
    } catch (error) {
      toast({
        title: "Error clearing search",
        description: "Failed to reset search results",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRelatedObituaries = (cemetery: any) => {
    setRelatedCemetery(cemetery);
    setIsRelatedDialogOpen(true);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to page 1 when changing items per page
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={handleToggleExpanded}
      >
        <div>
          <CardTitle>Interment Place Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage interment places and search records
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
              <Popover open={openCitySelect} onOpenChange={setOpenCitySelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCitySelect}
                    className="w-full justify-between"
                  >
                    {searchCityId
                      ? (cities?.find(
                          city => city?.id?.toString() === searchCityId
                        )?.name ?? "Unnamed")
                      : "All Cities"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <div className="flex flex-col">
                    <div className="border-b p-2">
                      <Input
                        placeholder="Search city..."
                        value={citySearch}
                        onChange={e => setCitySearch(e.target.value)}
                        className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <Command>
                      <CommandList>
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto p-1">
                          <CommandItem
                            value="all-cities"
                            onSelect={() => {
                              setSearchCityId(undefined);
                              setCitySearch("");
                              setOpenCitySelect(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !searchCityId ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All Cities
                          </CommandItem>
                          {(filteredCities || []).map(city => {
                            if (!city?.id) return null;
                            return (
                              <CommandItem
                                key={city.id}
                                value={city.id.toString()}
                                onSelect={() => {
                                  setSearchCityId(city.id?.toString());
                                  setCitySearch("");
                                  setOpenCitySelect(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    searchCityId === city.id?.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {city.name ?? "Unnamed"}{" "}
                                {city.country?.name
                                  ? `(${city.country.name})`
                                  : ""}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                </PopoverContent>
              </Popover>
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
              disabled={isLoading || (!searchName && !searchCityId)}
            >
              Reset
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {/* Cemetery List */}
          {isLoading && !isDataFetched ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cemeteries.length > 0 ? (
            <>
              <div className="grid gap-2">
                {cemeteries.map(cemetery => (
                  <div
                    key={cemetery.id}
                    className="p-2 border rounded flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">
                        {cemetery.name || "Unnamed"}
                      </span>
                      {cemetery.city && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({cemetery.city.name}
                          {cemetery.city.province &&
                            `, ${cemetery.city.province}`}
                          {cemetery.city.country?.name &&
                            `, ${cemetery.city.country.name}`}
                          )
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {loadingRelationIds.includes(cemetery.id) ? (
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Loading...
                        </span>
                      ) : obituaryCounts[cemetery.id] > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 px-2 text-xs bg-green-50 hover:bg-green-100 border-green-200"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenRelatedObituaries(cemetery);
                          }}
                        >
                          <FileText className="h-3 w-3" />
                          {obituaryCounts[cemetery.id]} Obituaries
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedCemetery(cemetery);
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
                    onClick={() =>
                      setCurrentPage(prev => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="py-2 px-3 text-sm">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : isDataFetched ? (
            <div className="py-8 text-center text-muted-foreground">
              No interment places found
            </div>
          ) : null}

          <AddCemeteryDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddCemetery={handleAddCemetery}
            cities={formattedCities}
            initialValues={{
              name: searchName,
              cityId: searchCityId ? parseInt(searchCityId) : undefined
            }}
          />

          <EditCemeteryDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedCemetery(null);
            }}
            onEditCemetery={handleEditCemetery}
            onDeleteCemetery={handleDeleteCemetery}
            cemetery={selectedCemetery}
            cities={formattedCities}
          />

          <RelatedCemeteryObituariesDialog
            isOpen={isRelatedDialogOpen}
            onClose={() => {
              setIsRelatedDialogOpen(false);
              setRelatedCemetery(null);
            }}
            cemetery={relatedCemetery}
          />
        </CardContent>
      )}
    </Card>
  );
}
