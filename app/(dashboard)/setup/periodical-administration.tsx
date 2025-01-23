'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Edit, Loader2, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { addPeriodical, deletePeriodical, getCities, getPeriodicals, searchPeriodicals, updatePeriodical } from './actions';
import AddPeriodicalDialog from './add-periodical-dialog';
import EditPeriodicalDialog from './edit-periodical-dialog';
import { CityWithRelations, PeriodicalWithRelations } from '@/types/prisma';

interface PeriodicalData {
  periodicals: PeriodicalWithRelations[];
  totalCount: number;
  totalPages: number;
}
// Use only Prisma types to include to Periodical types its relationship City



export function PeriodicalAdministration() {
  const [periodicalData, setPeriodicalData] = useState<PeriodicalData>({
    periodicals: [],
    totalCount: 0,
    totalPages: 0
  });
  const [cities, setCities] = useState<CityWithRelations[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPeriodical, setSelectedPeriodical] = useState<PeriodicalWithRelations | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isLoading, setIsLoading] = useState(false);

  const fetchPeriodicals = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getPeriodicals(page, itemsPerPage);
      setPeriodicalData({
        periodicals: data.periodicals.map(p => ({
          id: p.id,
          name: p.name,
          url: p.url,
          cityId: p.city?.id || null,
          city: p.city || null,
          _count: p._count
        })),
        totalCount: data.totalCount,
        totalPages: data.totalPages
      });
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
      async function fetchData() {
        const [periodicalsResult, citiesResult] = await Promise.all([
          getPeriodicals(currentPage, itemsPerPage),
          getCities()
        ]);
        setPeriodicalData({
          periodicals: periodicalsResult.periodicals.map(p => ({
            id: p.id,
            name: p.name,
            url: p.url,
            cityId: p.city?.id || null,
            city: p.city || null,
            _count: p._count
          })),
          totalCount: periodicalsResult.totalCount,
          totalPages: periodicalsResult.totalPages
        });
        setCities(citiesResult);
      }
      fetchData();
  }, [currentPage, toast]);

  const handleSearch = async () => {
    if (!searchName) {
      await fetchPeriodicals(1);
      setCurrentPage(1);
      return;
    }

    try {
      const results = await searchPeriodicals(searchName, 1, itemsPerPage);
      setPeriodicalData({
        periodicals: results.periodicals.map(p => ({
          id: p.id,
          name: p.name || '',
          url: p.url || '',
          cityId: p.city?.id || null,
          city: p.city || null,
          _count: p._count
        })),
        totalCount: results.totalCount,
        totalPages: results.totalPages
      });
      setCurrentPage(1);
      
      if (results.totalCount === 0) {
        toast({
          title: 'No results found',
          description: `No publications found matching "${searchName}"`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error searching publications',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAddPeriodical = async (name: string, url?: string | null, cityId?: number | null) => {
    try {
      const newPeriodical = await addPeriodical(name, url, cityId);
      toast({
        title: 'Success',
        description: 'Publication added successfully',
      });
      await fetchPeriodicals(1);
      setCurrentPage(1);
    } catch (error) {
      toast({
        title: 'Error adding publication',
        description: error instanceof Error ? error.message : 'Failed to add publication',
        variant: 'destructive'
      });
    }
  };

  const handleEditPeriodical = async (name: string, url?: string | null, cityId?: number | null) => {
    if (!selectedPeriodical) return;
    
    try {
      await updatePeriodical(selectedPeriodical.id, name, url, cityId);
      toast({
        title: 'Success',
        description: 'Publication updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedPeriodical(null);
      fetchPeriodicals(currentPage);
    } catch (error) {
      toast({
        title: 'Error updating publication',
        description: error instanceof Error ? error.message : 'Failed to update publication',
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
        description: 'Publication deleted successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedPeriodical(null);
      fetchPeriodicals(currentPage);
    } catch (error) {
      toast({
        title: 'Error deleting publication',
        description: error instanceof Error ? error.message : 'Failed to delete publication',
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
          <CardTitle>Publication Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage publications and search records
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
                <h3 className="text-sm font-medium mb-2">Found Publications:</h3>
                <div className="space-y-2">
                  {periodicalData.periodicals.map((periodical) => (
                    <div 
                      key={periodical.id} 
                      className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                    >
                      <div>
                        <span className="text-sm">{periodical.name}</span>

                          <span className="ml-2 text-sm text-muted-foreground">
                            {periodical.url ? `${periodical.url} ` : ''}
                            
                            {(periodical.city?.name) && (
                              <>
                              (
                                {periodical.city?.name && (
                                  <>
                                    {periodical.city.name}
                                    {periodical.city.province && ` - ${periodical.city.province}`}
                                    {periodical.city.country?.name && ` - ${periodical.city.country.name}`}
                                  </>
                                )}
                            
                              )
                              </>
                            )}
                          </span>
                          
                          {periodical._count?.obituaries !== undefined && (
                            <span title="Number of obituaries" className='text-muted-foreground text-xs'>
                                    {" "} ({periodical._count.obituaries} obituaries)
                            </span>
                          )}

                      </div>
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
        </CardContent>
      )}
    </Card>
  );
} 