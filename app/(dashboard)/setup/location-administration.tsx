'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

import ComboboxFormFieldAdmin from '@/components/ui/combo-form-field-admin';
import { Prisma } from '@prisma/client';
import { getCities, getCountries, addCity } from './actions';
import AddCityDialog from './add-city-dialog';

const formSchema = z.object({
  name: z.string().min(1, 'City name is required'),
  province: z.string().min(1, 'Province is required'),
  country: z.string().min(1, 'Country is required')
});

export function LocationAdministration() {
  const [cities, setCities] = useState<
    Prisma.CityGetPayload<{ include: { country: true } }>[]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      province: '',
      country: ''
    }
  });

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

  const handleAddCity = async (name: string, province: string, countryId: number) => {
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
          Check if the location is already in the database or add directly a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <Form {...form}>
            <form>
              <ComboboxFormFieldAdmin
                control={form.control}
                name="cityId"
                label="Locations already in the database"
                placeholder="Select a location"
                emptyText="No location found."
                items={cities
                  .sort((a, b) => {
                    const countryCompare = (a.country?.name || '').localeCompare(b.country?.name || '');
                    if (countryCompare !== 0) return countryCompare;
                    
                    const provinceCompare = (a.province || '').localeCompare(b.province || '');
                    if (provinceCompare !== 0) return provinceCompare;
                    
                    return (a.name || '').localeCompare(b.name || '');
                  })
                  .map((city) => ({
                    id: city.id,
                    name: [
                      city.country?.name,
                      city.province,
                      city.name
                    ]
                      .filter(Boolean)
                      .join(', ')
                      .trim()
                  }))}
                countries={countries}
              />
            </form>
          </Form>
          <div className="space-y-4">
          <div className="flex justify-start mt-4">
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Location
            </Button>
          </div>
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
