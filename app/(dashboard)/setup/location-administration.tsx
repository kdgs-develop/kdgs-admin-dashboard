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

import ComboboxFormFieldAdmin from '@/components/ui/combo-form-field-admin';
import { Prisma } from '@prisma/client';
import { getCities, getCountries } from './actions';

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

  const form = useForm({
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

  // Fetch countries
  const [countries, setCountries] = useState<{ id: number; name: string }[]>(
    []
  );

  useEffect(() => {
    async function fetchCountries() {
      const fetchedCountries = await getCountries();
      setCountries(fetchedCountries);
    }
    fetchCountries();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Locations</CardTitle>
        <CardDescription>
          Search for existing locations or add new ones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form>
            <ComboboxFormFieldAdmin
              control={form.control}
              name="cityId"
              label="Locations available"
              placeholder="Select a location"
              emptyText="No location found."
              items={cities.map((city) => ({
                id: city.id,
                name: city.name || '',
                province: city.province || undefined,
                country: city.country ? { name: city.country.name } : undefined
              }))}
              countries={countries}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
