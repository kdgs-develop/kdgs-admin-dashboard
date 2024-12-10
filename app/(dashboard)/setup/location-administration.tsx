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
import { Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCitiesWithPagination, addCity, updateCity, deleteCity, getCountries } from './actions';
import AddLocationDialog from './add-location-dialog';
import EditLocationDialog from './edit-location-dialog';

export function LocationAdministration() {
  const [cities, setCities] = useState<any[]>([]);
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const [citiesResult, countriesResult] = await Promise.all([
          getCitiesWithPagination(currentPage),
          getCountries()
        ]);
        setCities(citiesResult.cities);
        setTotalPages(citiesResult.totalPages);
        setCountries(countriesResult);
      } catch (error) {
        toast({
          title: 'Error fetching data',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive'
        });
      }
    }
    fetchData();
  }, [currentPage, toast]);

  const handleAddCity = async (name: string | null, province: string | null, countryId: number) => {
    try {
      const newCity = await addCity(name, province, countryId);
      const result = await getCitiesWithPagination(currentPage);
      setCities(result.cities);
      setTotalPages(result.totalPages);
      toast({
        title: 'Success',
        description: 'Location added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error adding location',
        description: error instanceof Error ? error.message : 'Failed to add location',
        variant: 'destructive'
      });
    }
  };

  const handleEditCity = async (id: number, name: string | null, province: string | null, countryId: number) => {
    try {
      await updateCity(id, name, province, countryId);
      const result = await getCitiesWithPagination(currentPage);
      setCities(result.cities);
      setTotalPages(result.totalPages);
      toast({
        title: 'Success',
        description: 'Location updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedCity(null);
    } catch (error) {
      toast({
        title: 'Error updating location',
        description: error instanceof Error ? error.message : 'Failed to update location',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCity = async (id: number) => {
    try {
      await deleteCity(id);
      const result = await getCitiesWithPagination(currentPage);
      setCities(result.cities);
      setTotalPages(result.totalPages);
      toast({
        title: 'Success',
        description: 'Location deleted successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedCity(null);
    } catch (error) {
      toast({
        title: 'Error deleting location',
        description: error instanceof Error ? error.message : 'Failed to delete location',
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
          <CardTitle>Location Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage locations
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
          <div className="flex justify-between items-center">
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New Location
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {cities.length > 0 && (
            <div className="grid gap-2">
              {cities.map((city) => (
                <div key={city.id} className="p-2 border rounded flex justify-between items-center">
                  <div>
                    <span className="font-medium">{city.name || 'Unnamed'}</span>
                    {city.province && <span className="ml-2 text-muted-foreground">{city.province}</span>}
                    {city.country && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({city.country.name})
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCity(city);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}

          <AddLocationDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddCity={handleAddCity}
            countries={countries}
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
        </CardContent>
      )}
    </Card>
  );
}
