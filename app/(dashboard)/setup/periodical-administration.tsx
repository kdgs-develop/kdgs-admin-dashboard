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
import { getPeriodicals, addPeriodical, searchPeriodicals, updatePeriodical, deletePeriodical } from './actions';
import AddPeriodicalDialog from './add-periodical-dialog';
import { Input } from '@/components/ui/input';
import EditPeriodicalDialog from './edit-periodical-dialog';

interface PeriodicalData {
  periodicals: { id: number; name: string | null }[];
  totalCount: number;
  totalPages: number;
}

export function PeriodicalAdministration() {
  const [periodicalData, setPeriodicalData] = useState<PeriodicalData>({
    periodicals: [],
    totalCount: 0,
    totalPages: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPeriodical, setSelectedPeriodical] = useState<{ id: number; name: string | null } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isLoading, setIsLoading] = useState(false);

  const fetchPeriodicals = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getPeriodicals(page, itemsPerPage);
      setPeriodicalData(data);
    } catch (error) {
      toast({
        title: 'Error fetching periodicals',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchPeriodicals(currentPage);
    }
  }, [currentPage, isExpanded]);

  const handleSearch = async () => {
    if (!searchName) {
      await fetchPeriodicals(1);
      setCurrentPage(1);
      return;
    }

    try {
      const results = await searchPeriodicals(searchName, 1, itemsPerPage);
      setPeriodicalData(results);
      setCurrentPage(1);
      
      if (results.totalCount === 0) {
        toast({
          title: 'No results found',
          description: `No periodicals found matching "${searchName}"`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error searching periodicals',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAddPeriodical = async (name: string) => {
    try {
      const newPeriodical = await addPeriodical(name);
      toast({
        title: 'Success',
        description: 'Periodical added successfully',
      });
      await fetchPeriodicals(1);
      setCurrentPage(1);
    } catch (error) {
      toast({
        title: 'Error adding periodical',
        description: error instanceof Error ? error.message : 'Failed to add periodical',
        variant: 'destructive'
      });
    }
  };

  const handleEditPeriodical = async (name: string) => {
    if (!selectedPeriodical) return;
    
    try {
      await updatePeriodical(selectedPeriodical.id, name);
      toast({
        title: 'Success',
        description: 'Periodical updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedPeriodical(null);
      fetchPeriodicals(currentPage);
    } catch (error) {
      toast({
        title: 'Error updating periodical',
        description: error instanceof Error ? error.message : 'Failed to update periodical',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePeriodical = async (id: number) => {
    if (!selectedPeriodical) return;
    
    try {
      await deletePeriodical(id);
      toast({
        title: 'Success',
        description: 'Periodical deleted successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedPeriodical(null);
      fetchPeriodicals(currentPage);
    } catch (error) {
      toast({
        title: 'Error deleting periodical',
        description: error instanceof Error ? error.message : 'Failed to delete periodical',
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
          <CardTitle>Periodical Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage periodicals and search records
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

          {periodicalData.periodicals.length > 0 && (
            <>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Found Periodicals:</h3>
                <div className="space-y-2">
                  {periodicalData.periodicals.map((periodical) => (
                    <div 
                      key={periodical.id} 
                      className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                    >
                      <span className="text-sm">{periodical.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPeriodical(periodical);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination Controls */}
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
                  Page {currentPage} of {periodicalData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, periodicalData.totalPages))}
                  disabled={currentPage === periodicalData.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <AddPeriodicalDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddPeriodical={handleAddPeriodical}
            initialName={searchName}
          />

          <EditPeriodicalDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedPeriodical(null);
            }}
            onEditPeriodical={handleEditPeriodical}
            onDeletePeriodical={handleDeletePeriodical}
            periodical={selectedPeriodical as { id: number; name: string } | null}
          />
        </CardContent>
      )}
    </Card>
  );
} 