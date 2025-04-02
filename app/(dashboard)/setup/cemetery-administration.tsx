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
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  addCemetery,
  deleteCemetery,
  getCemeteriesWithPagination,
  getCities,
  searchCemeteries,
  updateCemetery
} from "./actions";
import { AddCemeteryDialog } from "./add-cemetery-dialog";
import { EditCemeteryDialog } from "./edit-cemetery-dialog";

// Add this type for better type safety
type City = {
  id?: number | null;
  name?: string | null;
  country?: { name: string } | null;
} | null;

export function CemeteryAdministration() {
  const [cemeteries, setCemeteries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCemetery, setSelectedCemetery] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Search states
  const [searchName, setSearchName] = useState("");
  const [searchCityId, setSearchCityId] = useState<string | undefined>(
    undefined
  );

  const [openCitySelect, setOpenCitySelect] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [cemeteriesResult, citiesResult] = await Promise.all([
          getCemeteriesWithPagination(currentPage),
          getCities()
        ]);
        setCemeteries(cemeteriesResult.cemeteries);
        setTotalPages(cemeteriesResult.totalPages);
        setCities(citiesResult);
      } catch (error) {
        toast({
          title: "Error fetching data",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (isExpanded) {
      fetchData();
    }
  }, [currentPage, toast, isExpanded]);

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
      const newCemetery = await addCemetery(name, cityId);
      const result = await getCemeteriesWithPagination(currentPage);
      setCemeteries(result.cemeteries);
      setTotalPages(result.totalPages);
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
      const result = await getCemeteriesWithPagination(currentPage);
      setCemeteries(result.cemeteries);
      setTotalPages(result.totalPages);
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
      const result = await getCemeteriesWithPagination(currentPage);
      setCemeteries(result.cemeteries);
      setTotalPages(result.totalPages);
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
    try {
      setIsLoading(true);
      const result = await searchCemeteries(
        searchName || undefined,
        searchCityId ? parseInt(searchCityId) : undefined,
        1 // Always start at page 1 when searching
      );
      setCemeteries(result.cemeteries);
      setTotalPages(result.totalPages);
      setCurrentPage(1); // Reset current page to 1
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

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
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
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {/* Cemetery List */}
          {cemeteries.length > 0 && (
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCemetery(cemetery);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                ))}
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
                  Page {currentPage} of {totalPages}
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
            </>
          )}

          <AddCemeteryDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddCemetery={handleAddCemetery}
            cities={cities}
            initialValues={{
              name: searchName,
              cityId: searchCityId
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
            cities={cities}
          />
        </CardContent>
      )}
    </Card>
  );
}
