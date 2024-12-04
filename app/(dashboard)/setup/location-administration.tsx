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
import { Plus } from 'lucide-react';
import { Prisma } from '@prisma/client';
import { getCities, getCountries, addCity } from './actions';
import AddCityDialog from './add-city-dialog';

export function LocationAdministration() {
  const [cities, setCities] = useState<
    Prisma.CityGetPayload<{ include: { country: true } }>[]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    async function fetchCities() {
      try {
        const fetchedCities = await getCities();
        setCities(
          fetchedCities as Prisma.CityGetPayload<{
            include: { country: true };
          }>[]
        );
      } catch (error) {
        toast({
          title: 'Error fetching cities',
          description:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          variant: 'destructive'
        });
      }
    }
    fetchCities();
  }, [toast]);

  useEffect(() => {
    async function fetchCountries() {
      const fetchedCountries = await getCountries();
      setCountries(fetchedCountries);
    }
    fetchCountries();
  }, []);

  const handleAddCity = async (name: string | null, province: string | null, countryId: number) => {
    try {
      const newCity = await addCity(name, province, countryId);
      setCities(prev => [...prev, newCity as any]);
      toast({
        title: 'Success',
        description: 'Location added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error adding city',
        description: error instanceof Error ? error.message : 'Failed to add city',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Location</CardTitle>
        <CardDescription>
          Add a new location to the database, if the location already exists it will throw an error message to the user.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <div className="flex justify-start">
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Location
            </Button>
          </div>
        <AddCityDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAddCity={handleAddCity}
          countries={countries}
        />
      </CardContent>
    </Card>
  );
}
