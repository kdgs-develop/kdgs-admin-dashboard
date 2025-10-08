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
  FileText
} from "lucide-react";
import {
  getTitles,
  addTitle,
  searchTitles,
  updateTitle,
  deleteTitle,
  getObituariesByTitleId
} from "./actions";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import AddTitleDialog from "./add-title-dialog";
import EditTitleDialog from "./edit-title-dialog";
import { RelatedTitleObituariesDialog } from "./related-title-obituaries-dialog";

interface TitleData {
  titles: { id: number; name: string | null }[];
  totalCount: number;
  totalPages: number;
}

interface TitleAdministrationProps {
  forceExpanded?: boolean;
}

export function TitleAdministration({
  forceExpanded = false
}: TitleAdministrationProps) {
  const [titleData, setTitleData] = useState<TitleData>({
    titles: [],
    totalCount: 0,
    totalPages: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<{
    id: number;
    name: string | null;
  } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(forceExpanded);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [obituaryCounts, setObituaryCounts] = useState<Record<number, number>>(
    {}
  );
  const [loadingRelationIds, setLoadingRelationIds] = useState<number[]>([]);
  const [isRelatedDialogOpen, setIsRelatedDialogOpen] = useState(false);
  const [relatedTitle, setRelatedTitle] = useState<{
    id: number;
    name: string | null;
  } | null>(null);

  const fetchTitles = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getTitles(page, itemsPerPage);
      setTitleData(data);
      setIsDataFetched(true);

      if (data.titles.length > 0) {
        fetchObituaryCounts(data.titles);
      }
    } catch (error) {
      toast({
        title: "Error fetching titles",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchObituaryCounts = async (
    titlesList: { id: number; name: string | null }[]
  ) => {
    // Mark all titles as loading
    setLoadingRelationIds(titlesList.map(title => title.id));

    // Process each title individually to show results as they come in
    for (const title of titlesList) {
      try {
        const result = await getObituariesByTitleId(title.id);

        // Update the count for this specific title
        setObituaryCounts(prev => ({
          ...prev,
          [title.id]: result.count
        }));
      } catch (error) {
        console.error(`Error fetching count for title ${title.id}:`, error);

        // Set count to 0 on error
        setObituaryCounts(prev => ({
          ...prev,
          [title.id]: 0
        }));
      } finally {
        // Remove this title from loading state
        setLoadingRelationIds(prev => prev.filter(id => id !== title.id));
      }
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchTitles(currentPage);
    }
  }, [currentPage, itemsPerPage, isExpanded]);

  const handleSearch = async () => {
    if (!isExpanded) return;

    setIsLoading(true);
    try {
      if (!searchName) {
        await fetchTitles(1);
        setCurrentPage(1);
        return;
      }

      const results = await searchTitles(searchName, 1, itemsPerPage);
      setTitleData(results);
      setCurrentPage(1);

      if (results.titles.length > 0) {
        fetchObituaryCounts(results.titles);
      } else {
        setObituaryCounts({});
      }

      if (results.totalCount === 0) {
        toast({
          title: "No results found",
          description: `No titles found matching "${searchName}"`
        });
      }
    } catch (error) {
      toast({
        title: "Error searching titles",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTitle = async (name: string) => {
    try {
      const newTitle = await addTitle(name);
      toast({
        title: "Success",
        description: "Title added successfully"
      });

      if (isExpanded) {
        await fetchTitles(1);
        setCurrentPage(1);
      }
    } catch (error) {
      toast({
        title: "Error adding title",
        description:
          error instanceof Error ? error.message : "Failed to add title",
        variant: "destructive"
      });
    }
  };

  const handleEditTitle = async (name: string) => {
    if (!selectedTitle) return;

    try {
      await updateTitle(selectedTitle.id, name);
      toast({
        title: "Success",
        description: "Title updated successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedTitle(null);

      if (isExpanded) {
        fetchTitles(currentPage);
      }
    } catch (error) {
      toast({
        title: "Error updating title",
        description:
          error instanceof Error ? error.message : "Failed to update title",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTitle = async (id: number) => {
    if (!selectedTitle) return;

    try {
      await deleteTitle(id);
      toast({
        title: "Success",
        description: "Title deleted successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedTitle(null);

      if (isExpanded) {
        fetchTitles(currentPage);
      }
    } catch (error) {
      toast({
        title: "Error deleting title",
        description:
          error instanceof Error ? error.message : "Failed to delete title",
        variant: "destructive"
      });
    }
  };

  const handleToggleExpanded = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // If expanding and data hasn't been fetched yet, the useEffect will handle it
  };

  const handleClearSearch = async () => {
    if (!isExpanded) return;

    setSearchName("");
    await fetchTitles(1);
    setCurrentPage(1);
  };

  const handleOpenRelatedObituaries = (title: {
    id: number;
    name: string | null;
  }) => {
    setRelatedTitle(title);
    setIsRelatedDialogOpen(true);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to page 1 when changing items per page
  };

  return (
    <Card>
      <CardHeader
        className={`flex flex-row items-center justify-between ${
          !forceExpanded ? "cursor-pointer" : ""
        }`}
        onClick={!forceExpanded ? handleToggleExpanded : undefined}
      >
        <div>
          <CardTitle>Title Management</CardTitle>
          {!isExpanded && !forceExpanded && (
            <CardDescription>
              Click to manage titles and search records
            </CardDescription>
          )}
        </div>
        {!forceExpanded && (
          <Button variant="ghost" size="icon">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
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
          ) : titleData.titles.length > 0 ? (
            <>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Found Titles:</h3>
                <div className="space-y-2">
                  {titleData.titles.map(title => (
                    <div
                      key={title.id}
                      className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                    >
                      <span className="text-sm">{title.name}</span>
                      <div className="flex items-center gap-2">
                        {loadingRelationIds.includes(title.id) ? (
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Loading...
                          </span>
                        ) : obituaryCounts[title.id] > 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 px-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
                            onClick={e => {
                              e.stopPropagation();
                              handleOpenRelatedObituaries(title);
                            }}
                          >
                            <FileText className="h-3 w-3" />
                            {obituaryCounts[title.id]} Obituaries
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedTitle(title);
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
                    Page {currentPage} of {titleData.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(prev =>
                        Math.min(prev + 1, titleData.totalPages)
                      )
                    }
                    disabled={currentPage === titleData.totalPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : isDataFetched ? (
            <div className="py-8 text-center text-muted-foreground">
              No titles found
            </div>
          ) : null}

          <AddTitleDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddTitle={handleAddTitle}
            initialName={searchName}
          />

          <EditTitleDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedTitle(null);
            }}
            onEditTitle={handleEditTitle}
            onDeleteTitle={handleDeleteTitle}
            title={selectedTitle as { id: number; name: string } | null}
          />

          <RelatedTitleObituariesDialog
            isOpen={isRelatedDialogOpen}
            onClose={() => {
              setIsRelatedDialogOpen(false);
              setRelatedTitle(null);
            }}
            title={relatedTitle}
          />
        </CardContent>
      )}
    </Card>
  );
}
