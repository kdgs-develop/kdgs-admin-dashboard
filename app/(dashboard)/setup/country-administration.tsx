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
import { getCountries, addCountry, searchCountries, updateCountry, deleteCountry } from './actions';
import { Input } from '@/components/ui/input';
import AddCountryDialog from './add-country-dialog';
import EditCountryDialog from './edit-country-dialog';

interface CountryData {
  countries: { id: number; name: string }[];
  totalCount: number;
  totalPages: number;
}

export function CountryAdministration() {
  const [countryData, setCountryData] = useState<CountryData>({
    countries: [],
    totalCount: 0,
    totalPages: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isLoading, setIsLoading] = useState(false);

  const fetchCountries = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getCountries(page, itemsPerPage);
      setCountryData(data);
    } catch (error) {
      toast({
        title: 'Error fetching countries',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchCountries(currentPage);
    }
  }, [currentPage, isExpanded]);

  const handleSearch = async () => {
    if (!searchName) {
      await fetchCountries(1);
      setCurrentPage(1);
      return;
    }

    try {
      const results = await searchCountries(searchName, 1, itemsPerPage);
      setCountryData(results);
      setCurrentPage(1);
      
      if (results.totalCount === 0) {
        toast({
          title: 'No results found',
          description: `No countries found matching "${searchName}"`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error searching countries',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAddCountry = async (name: string) => {
    try {
      const newCountry = await addCountry(name);
      toast({
        title: 'Success',
        description: 'Country added successfully',
      });
      await fetchCountries(1);
      setCurrentPage(1);
    } catch (error) {
      toast({
        title: 'Error adding country',
        description: error instanceof Error ? error.message : 'Failed to add country',
        variant: 'destructive'
      });
    }
  };

  const handleEditCountry = async (name: string) => {
    if (!selectedCountry) return;
    
    try {
      await updateCountry(selectedCountry.id, name);
      toast({
        title: 'Success',
        description: 'Country updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedCountry(null);
      fetchCountries(currentPage);
    } catch (error) {
      toast({
        title: 'Error updating country',
        description: error instanceof Error ? error.message : 'Failed to update country',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCountry = async (id: number) => {
    if (!selectedCountry) return;
    
    try {
      await deleteCountry(id);
      toast({
        title: 'Success',
        description: 'Country deleted successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedCountry(null);
      fetchCountries(currentPage);
    } catch (error) {
      toast({
        title: 'Error deleting country',
        description: error instanceof Error ? error.message : 'Failed to delete country',
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
          <CardTitle>Country Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage countries
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

          {countryData.countries.length > 0 && (
            <>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Found Countries:</h3>
                <div className="space-y-2">
                  {countryData.countries.map((country) => (
                    <div 
                      key={country.id} 
                      className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                    >
                      <span className="text-sm">{country.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCountry(country);
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
                  Page {currentPage} of {countryData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, countryData.totalPages))}
                  disabled={currentPage === countryData.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <AddCountryDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddCountry={handleAddCountry}
            initialName={searchName}
          />

          <EditCountryDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedCountry(null);
            }}
            onEditCountry={handleEditCountry}
            onDeleteCountry={handleDeleteCountry}
            country={selectedCountry}
          />
        </CardContent>
      )}
    </Card>
  );
} 