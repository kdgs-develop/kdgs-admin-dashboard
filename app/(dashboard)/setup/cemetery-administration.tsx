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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  Search
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  addCemetery,
  deleteCemetery,
  getCemeteriesWithPagination,
  getCities,
  searchCemeteries,
  updateCemetery
} from './actions';
import { AddCemeteryDialog } from './add-cemetery-dialog';
import { EditCemeteryDialog } from './edit-cemetery-dialog';

export function CemeteryAdministration() {
  const [cemeteries, setCemeteries] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCemetery, setSelectedCemetery] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Search states
  const [searchName, setSearchName] = useState('');
  const [searchCityId, setSearchCityId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const [cemeteriesResult, citiesResult] = await Promise.all([
          getCemeteriesWithPagination(currentPage),
          getCities()
        ]);
        setCemeteries(cemeteriesResult.cemeteries);
        setTotalPages(cemeteriesResult.totalPages);
        setCities(citiesResult);
      } catch (error) {
        toast({
          title: 'Error fetching data',
          description:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          variant: 'destructive'
        });
      }
    }
    fetchData();
  }, [currentPage, toast]);

  const handleAddCemetery = async (name: string | null, cityId: number) => {
    try {
      const newCemetery = await addCemetery(name, cityId);
      const result = await getCemeteriesWithPagination(currentPage);
      setCemeteries(result.cemeteries);
      setTotalPages(result.totalPages);
      toast({
        title: 'Success',
        description: 'Cemetery added successfully'
      });
    } catch (error) {
      toast({
        title: 'Error adding cemetery',
        description:
          error instanceof Error ? error.message : 'Failed to add cemetery',
        variant: 'destructive'
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
        title: 'Success',
        description: 'Cemetery updated successfully'
      });
      setIsEditDialogOpen(false);
      setSelectedCemetery(null);
    } catch (error) {
      toast({
        title: 'Error updating cemetery',
        description:
          error instanceof Error ? error.message : 'Failed to update cemetery',
        variant: 'destructive'
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
        title: 'Success',
        description: 'Cemetery deleted successfully'
      });
      setIsEditDialogOpen(false);
      setSelectedCemetery(null);
    } catch (error) {
      toast({
        title: 'Error deleting cemetery',
        description:
          error instanceof Error ? error.message : 'Failed to delete cemetery',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = async () => {
    try {
      const result = await searchCemeteries(
        searchName || undefined,
        searchCityId ? parseInt(searchCityId) : undefined,
        currentPage
      );
      setCemeteries(result.cemeteries);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast({
        title: 'Error searching cemeteries',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
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
          <CardTitle>Cemetery Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage cemeteries and search records
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
            <div className="flex-1">
              <Select value={searchCityId} onValueChange={setSearchCityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.name} {city.country && `(${city.country.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSearch} variant="secondary">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {/* Pagination */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Cemetery List */}
          {cemeteries.length > 0 && (
            <div className="grid gap-2">
              {cemeteries.map((cemetery) => (
                <div
                  key={cemetery.id}
                  className="p-2 border rounded flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium">
                      {cemetery.name || 'Unnamed'}
                    </span>
                    {cemetery.city && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({cemetery.city.name}, {cemetery.city.country.name})
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
