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
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit,
  Loader2,
  Plus,
  Search,
  LinkIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  addRelationship,
  deleteRelationship,
  getRelationships,
  searchRelationships,
  updateRelationship,
  getObituariesByRelationshipId
} from "./actions";
import AddRelationshipDialog from "./add-relationship-dialog";
import EditRelationshipDialog from "./edit-relationship-dialog";
import { RelatedRelationshipObituariesDialog } from "./related-relationship-obituaries-dialog";

interface RelationshipData {
  relationships: { id: string; name: string; category: string }[];
  totalCount: number;
  totalPages: number;
}

export function RelationshipAdministration() {
  const [relationshipData, setRelationshipData] = useState<RelationshipData>({
    relationships: [],
    totalCount: 0,
    totalPages: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<{
    id: string;
    name: string;
    category: string;
  } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isLoading, setIsLoading] = useState(false);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [obituaryCounts, setObituaryCounts] = useState<Record<string, number>>(
    {}
  );
  const [isRelatedDialogOpen, setIsRelatedDialogOpen] = useState(false);
  const [relatedRelationship, setRelatedRelationship] = useState<{
    id: string;
    name: string;
    category: string;
  } | null>(null);

  const fetchRelationships = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getRelationships(page, itemsPerPage);
      setRelationshipData({
        relationships: data.relationships.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category
        })),
        totalCount: data.totalCount,
        totalPages: data.totalPages
      });
      setIsDataFetched(true);

      // Fetch obituary counts for each relationship
      await fetchObituaryCounts(data.relationships);
    } catch (error) {
      toast({
        title: "Error fetching relationships",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch relationships",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchObituaryCounts = async (
    relationshipsList: { id: string; name: string; category: string }[]
  ) => {
    try {
      const counts: Record<string, number> = {};

      await Promise.all(
        relationshipsList.map(async relationship => {
          if (relationship.id) {
            const data = await getObituariesByRelationshipId(relationship.id);
            counts[relationship.id] = data.count;
          }
        })
      );

      setObituaryCounts(counts);
    } catch (error) {
      console.error("Error fetching obituary counts:", error);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchRelationships(currentPage);
    }
  }, [currentPage, isExpanded]);

  const handleSearch = async () => {
    if (!isExpanded) return;

    setIsLoading(true);
    try {
      if (!searchName.trim()) {
        await fetchRelationships(1);
        setCurrentPage(1);
        return;
      }

      const results = await searchRelationships(searchName, 1, itemsPerPage);
      setRelationshipData({
        relationships: results.relationships.map(r => ({
          id: r.id,
          name: r.name,
          category: r.category
        })),
        totalCount: results.totalCount,
        totalPages: results.totalPages
      });
      setCurrentPage(1);

      // Fetch obituary counts for search results
      await fetchObituaryCounts(results.relationships);
    } catch (error) {
      toast({
        title: "Error searching relationships",
        description:
          error instanceof Error
            ? error.message
            : "Failed to search relationships",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRelationship = async (name: string, category: string) => {
    try {
      await addRelationship(name, category);
      toast({
        title: "Success",
        description: "Relationship added successfully"
      });
      if (isExpanded) {
        fetchRelationships(currentPage);
      }
    } catch (error) {
      toast({
        title: "Error adding relationship",
        description:
          error instanceof Error ? error.message : "Failed to add relationship",
        variant: "destructive"
      });
    }
  };

  const handleEditRelationship = async (
    id: string,
    name: string,
    category: string
  ) => {
    if (!selectedRelationship) return;

    try {
      await updateRelationship(id, name, category);
      toast({
        title: "Success",
        description: "Relationship updated successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedRelationship(null);
      if (isExpanded) {
        fetchRelationships(currentPage);
      }
    } catch (error) {
      toast({
        title: "Error updating relationship",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update relationship",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRelationship = async (id: string) => {
    if (!selectedRelationship) return;

    try {
      await deleteRelationship(id);
      toast({
        title: "Success",
        description: "Relationship deleted successfully"
      });
      setIsEditDialogOpen(false);
      setSelectedRelationship(null);
      if (isExpanded) {
        fetchRelationships(currentPage);
      }
    } catch (error) {
      toast({
        title: "Error deleting relationship",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete relationship",
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
    await fetchRelationships(1);
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={handleToggleExpanded}
      >
        <div>
          <CardTitle>Family Relationship Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage family relationships
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
                placeholder="Search by relationship name"
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
          ) : relationshipData.relationships.length > 0 ? (
            <>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">
                  Found Relationships:
                </h3>
                <div className="space-y-2">
                  {relationshipData.relationships.map(relationship => (
                    <div
                      key={relationship.id}
                      className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                    >
                      <div className="flex items-center">
                        <span className="text-sm">{relationship.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({relationship.category})
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setRelatedRelationship(relationship);
                            setIsRelatedDialogOpen(true);
                          }}
                        >
                          <LinkIcon className="h-4 w-4 mr-1" />
                          {obituaryCounts[relationship.id] !== undefined ? (
                            <>{obituaryCounts[relationship.id]} obituaries</>
                          ) : (
                            "View obituaries"
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedRelationship(relationship);
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
                  Page {currentPage} of {relationshipData.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(prev =>
                      Math.min(prev + 1, relationshipData.totalPages)
                    )
                  }
                  disabled={
                    currentPage === relationshipData.totalPages || isLoading
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : isDataFetched ? (
            <div className="py-8 text-center text-muted-foreground">
              No relationships found
            </div>
          ) : null}

          <AddRelationshipDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddRelationship={handleAddRelationship}
            initialName={searchName}
          />

          <EditRelationshipDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedRelationship(null);
            }}
            onEditRelationship={async (name: string, category: string) => {
              if (!selectedRelationship) return;
              await handleEditRelationship(
                selectedRelationship.id,
                name,
                category
              );
            }}
            onDeleteRelationship={handleDeleteRelationship}
            relationship={
              selectedRelationship && {
                id: selectedRelationship.id,
                name: selectedRelationship.name,
                category: selectedRelationship.category
              }
            }
          />

          <RelatedRelationshipObituariesDialog
            isOpen={isRelatedDialogOpen}
            onClose={() => {
              setIsRelatedDialogOpen(false);
              setRelatedRelationship(null);
            }}
            relationship={relatedRelationship}
          />
        </CardContent>
      )}
    </Card>
  );
}
