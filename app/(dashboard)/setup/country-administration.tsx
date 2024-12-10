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
import { getCountriesWithPagination, addCountry, deleteCountry } from './actions';
import AddCountryDialog from './add-country-dialog';
import EditCountryDialog from './edit-country-dialog';

export function CountryAdministration() {
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<{ id: number; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCountries() {
      try {
        const result = await getCountriesWithPagination(currentPage);
        setCountries(result.countries);
        setTotalPages(result.totalPages);
      } catch (error) {
        toast({
          title: 'Error fetching countries',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive'
        });
      }
    }
    fetchCountries();
  }, [currentPage, toast]);

  const handleAddCountry = async (name: string) => {
    try {
      const newCountry = await addCountry(name);
      const result = await getCountriesWithPagination(currentPage);
      setCountries(result.countries);
      setTotalPages(result.totalPages);
      toast({
        title: 'Success',
        description: 'Country added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error adding country',
        description: error instanceof Error ? error.message : 'Failed to add country',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCountry = async (id: number) => {
    if (!selectedCountry) return;
    
    try {
      await deleteCountry(id);
      setCountries(prev => prev.filter(country => country.id !== id));
      toast({
        title: 'Success',
        description: 'Country deleted successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedCountry(null);
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
          <div className="flex justify-between items-center">
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New Country
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

          {countries.length > 0 && (
            <div className="grid gap-2">
              {countries.map((country) => (
                <div key={country.id} className="p-2 border rounded flex justify-between items-center">
                  <span>{country.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCountry(country);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}

          <AddCountryDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddCountry={handleAddCountry}
          />

          <EditCountryDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedCountry(null);
            }}
            onDeleteCountry={handleDeleteCountry}
            country={selectedCountry}
          />
        </CardContent>
      )}
    </Card>
  );
} 