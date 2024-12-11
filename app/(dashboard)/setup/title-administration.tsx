'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Edit, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getTitles, addTitle, searchTitles, updateTitle, deleteTitle } from './actions';
import { Input } from '@/components/ui/input';
import AddTitleDialog from './add-title-dialog';
import EditTitleDialog from './edit-title-dialog';

interface TitleData {
  titles: { id: number; name: string | null }[];
  totalCount: number;
  totalPages: number;
}

export function TitleAdministration() {
  const [titleData, setTitleData] = useState<TitleData>({
    titles: [],
    totalCount: 0,
    totalPages: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<{ id: number; name: string | null } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isLoading, setIsLoading] = useState(false);

  const fetchTitles = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getTitles(page, itemsPerPage);
      setTitleData(data);
    } catch (error) {
      toast({
        title: 'Error fetching titles',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchTitles(currentPage);
    }
  }, [currentPage, isExpanded]);

  const handleSearch = async () => {
    if (!searchName) {
      await fetchTitles(1);
      setCurrentPage(1);
      return;
    }

    try {
      const results = await searchTitles(searchName, 1, itemsPerPage);
      setTitleData(results);
      setCurrentPage(1);
      
      if (results.totalCount === 0) {
        toast({
          title: 'No results found',
          description: `No titles found matching "${searchName}"`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error searching titles',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAddTitle = async (name: string) => {
    try {
      const newTitle = await addTitle(name);
      toast({
        title: 'Success',
        description: 'Title added successfully',
      });
      await fetchTitles(1);
      setCurrentPage(1);
    } catch (error) {
      toast({
        title: 'Error adding title',
        description: error instanceof Error ? error.message : 'Failed to add title',
        variant: 'destructive'
      });
    }
  };

  const handleEditTitle = async (name: string) => {
    if (!selectedTitle) return;
    
    try {
      await updateTitle(selectedTitle.id, name);
      toast({
        title: 'Success',
        description: 'Title updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedTitle(null);
      fetchTitles(currentPage);
    } catch (error) {
      toast({
        title: 'Error updating title',
        description: error instanceof Error ? error.message : 'Failed to update title',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteTitle = async (id: number) => {
    if (!selectedTitle) return;
    
    try {
      await deleteTitle(id);
      toast({
        title: 'Success',
        description: 'Title deleted successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedTitle(null);
      fetchTitles(currentPage);
    } catch (error) {
      toast({
        title: 'Error deleting title',
        description: error instanceof Error ? error.message : 'Failed to delete title',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <CardTitle>Title Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage titles and search records
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
                onChange={(e) => setSearchName(e.target.value)}
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
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {titleData.titles.length > 0 && (
            <>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Found Titles:</h3>
                <div className="space-y-2">
                  {titleData.titles.map((title) => (
                    <div 
                      key={title.id} 
                      className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                    >
                      <span className="text-sm">{title.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTitle(title);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="py-2 px-3 text-sm">
                  Page {currentPage} of {titleData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, titleData.totalPages))}
                  disabled={currentPage === titleData.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

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
        </CardContent>
      )}
    </Card>
  );
} 