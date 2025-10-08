"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  Plus,
  Search,
  LinkIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  addPeriodical,
  deletePeriodical,
  getCities,
  getPeriodicals,
  searchPeriodicals,
  updatePeriodical,
  getObituariesByPeriodicalId
} from "./actions";
import AddPeriodicalDialog from "./add-periodical-dialog";
import EditPeriodicalDialog from "./edit-periodical-dialog";
import { CityWithRelations, PeriodicalWithRelations } from "@/types/prisma";
import { RelatedPeriodicalObituariesDialog } from "./related-periodical-obituaries-dialog";
import { useSharedData } from "./shared-data-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface PeriodicalData {
  periodicals: PeriodicalWithRelations[];
  totalCount: number;
  totalPages: number;
}
// Use only Prisma types to include to Periodical types its relationship City

export function PeriodicalAdministration() {
  const { cities, initializeData, isInitialized } = useSharedData();
  const [periodicalData, setPeriodicalData] = useState<PeriodicalData>({
    periodicals: [],
    totalCount: 0,
    totalPages: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPeriodical, setSelectedPeriodical] =
    useState<PeriodicalWithRelations | null>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [obituaryCounts, setObituaryCounts] = useState<Record<number, number>>(
    {}
  );
  const [loadingRelationIds, setLoadingRelationIds] = useState<number[]>([]);

  // Related obituaries states
  const [relatedPeriodical, setRelatedPeriodical] = useState<{
    id: number;
    name: string | null;
  } | null>(null);
  const [isRelatedDialogOpen, setIsRelatedDialogOpen] = useState(false);

  const fetchPeriodicals = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getPeriodicals(page, itemsPerPage);
      const periodicals = data.periodicals.map(p => ({
        id: p.id,
        name: p.name,
        url: p.url,
        cityId: p.city?.id || null,
        city: p.city || null,
        _count: p._count
      }));

      setPeriodicalData({
        periodicals,
        totalCount: data.totalCount,
        totalPages: data.totalPages
      });
      setIsDataFetched(true);

      // Fetch obituary counts for each periodical
      await fetchObituaryCounts(periodicals);
    } catch (error) {
      toast({
        title: "Error fetching periodicals",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchObituaryCounts = async (
    periodicalsList: PeriodicalWithRelations[]
  ) => {
    // Mark all periodicals as loading
    setLoadingRelationIds(periodicalsList.map(periodical => periodical.id));

    // Process each periodical individually to show results as they come in
    for (const periodical of periodicalsList) {
      try {
        if (periodical.id) {
          const data = await getObituariesByPeriodicalId(periodical.id);

          // Update the count for this specific periodical
          setObituaryCounts(prev => ({
            ...prev,
            [periodical.id]: data.count
          }));
        }
      } catch (error) {
        console.error(
          `Error fetching count for periodical ${periodical.id}:`,
          error
        );

        // Set count to 0 on error
        setObituaryCounts(prev => ({
          ...prev,
          [periodical.id]: 0
        }));
      } finally {
        // Remove this periodical from loading state
        setLoadingRelationIds(prev => prev.filter(id => id !== periodical.id));
      }
    }
  };

  useEffect(() => {
    fetchPeriodicals(currentPage);
  }, [currentPage, itemsPerPage]);

  // Initialize shared data when component expands
  useEffect(() => {
    if (!isInitialized) {
      initializeData().catch(error => {
        toast({
          title: "Error",
          description: "Failed to initialize shared data",
          variant: "destructive"
        });
      });
    }
  }, [isInitialized, initializeData, toast]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      if (!searchName.trim()) {
        await fetchPeriodicals(1);
        setCurrentPage(1);
        return;
      }

      const results = await searchPeriodicals(searchName, 1, itemsPerPage);
      const periodicals = results.periodicals.map(p => ({
        id: p.id,
        name: p.name || "",
        url: p.url || "",
        cityId: p.city?.id || null,
        city: p.city || null,
        _count: p._count
      }));

      setPeriodicalData({
        periodicals,
        totalCount: results.totalCount,
        totalPages: results.totalPages
      });
      setCurrentPage(1);

      // Fetch obituary counts for search results
      await fetchObituaryCounts(periodicals);
    } catch (error) {
      toast({
        title: "Error searching publications",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPeriodical = async (
    name: string,
    url?: string | null,
    cityId?: number | null
  ) => {
    try {
      const newPeriodical = await addPeriodical(name, url, cityId);
      toast({
        title: "Success",
        description: "Publication added successfully"
      });

      await fetchPeriodicals(1);
      setCurrentPage(1);
    } catch (error) {
      toast({
        title: "Error adding publication",
        description:
          error instanceof Error ? error.message : "Failed to add publication",
        variant: "destructive"
      });
    }
  };

  const handleEditPeriodical = async (
    name: string,
    url?: string | null,
    cityId?: number | null
  ) => {
    if (!selectedPeriodical) return;

    try {
      await updatePeriodical(selectedPeriodical.id, name, url, cityId);
      toast({
        title: "Success",
        description: "Publication updated successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedPeriodical(null);

      fetchPeriodicals(currentPage);
    } catch (error) {
      toast({
        title: "Error updating publication",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update publication",
        variant: "destructive"
      });
    }
  };

  const handleDeletePeriodical = async (id: number) => {
    if (!selectedPeriodical) return;

    try {
      await deletePeriodical(id);
      toast({
        title: "Success",
        description: "Publication deleted successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedPeriodical(null);

      fetchPeriodicals(currentPage);
    } catch (error) {
      toast({
        title: "Error deleting publication",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete publication",
        variant: "destructive"
      });
    }
  };

  const handleClearSearch = async () => {
    setSearchName("");
    await fetchPeriodicals(1);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to page 1 when changing items per page
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
          />
        </div>
        <Button onClick={handleSearch} variant="secondary" disabled={isLoading}>
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
          disabled={isLoading || !searchName}
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

      {isLoading && !isDataFetched ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : periodicalData.periodicals.length > 0 ? (
        <>
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Found Publications:</h3>
            <div className="space-y-2">
              {periodicalData.periodicals.map(periodical => (
                <div
                  key={periodical.id}
                  className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                >
                  <div>
                    <span className="text-sm">{periodical.name}</span>

                    <span className="ml-2 text-sm text-muted-foreground">
                      {periodical.url ? `${periodical.url} ` : ""}

                      {periodical.city?.name && (
                        <>
                          (
                          {periodical.city?.name && (
                            <>
                              {periodical.city.name}
                              {periodical.city.province &&
                                ` - ${periodical.city.province}`}
                              {periodical.city.country?.name &&
                                ` - ${periodical.city.country.name}`}
                            </>
                          )}
                          )
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {loadingRelationIds.includes(periodical.id) ? (
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Loading...
                      </span>
                    ) : obituaryCounts[periodical.id] > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 px-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                        onClick={e => {
                          e.stopPropagation();
                          setRelatedPeriodical({
                            id: periodical.id,
                            name: periodical.name
                          });
                          setIsRelatedDialogOpen(true);
                        }}
                      >
                        <LinkIcon className="h-3 w-3" />
                        {obituaryCounts[periodical.id]} Obituaries
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedPeriodical(periodical);
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

          {/* Pagination Controls */}
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="py-2 px-3 text-sm">
                Page {currentPage} of {periodicalData.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(prev =>
                    Math.min(prev + 1, periodicalData.totalPages)
                  )
                }
                disabled={
                  currentPage === periodicalData.totalPages || isLoading
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      ) : isDataFetched ? (
        <div className="py-8 text-center text-muted-foreground">
          No publications found
        </div>
      ) : null}

      <AddPeriodicalDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddPeriodical={handleAddPeriodical}
        initialName={searchName}
        cities={cities}
      />

      <EditPeriodicalDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedPeriodical(null);
        }}
        onEditPeriodical={handleEditPeriodical}
        onDeletePeriodical={handleDeletePeriodical}
        periodical={selectedPeriodical as PeriodicalWithRelations | null}
        cities={cities}
      />

      <RelatedPeriodicalObituariesDialog
        isOpen={isRelatedDialogOpen}
        onClose={() => {
          setIsRelatedDialogOpen(false);
          setRelatedPeriodical(null);
        }}
        periodical={relatedPeriodical}
      />
    </div>
  );
}
