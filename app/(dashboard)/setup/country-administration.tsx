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
import { getCountries, addCountry } from './actions';
import AddCountryDialog from './add-country-dialog';

export function CountryAdministration() {
  const [countries, setCountries] = useState<{ id: number; name: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCountries() {
      try {
        const fetchedCountries = await getCountries();
        setCountries(fetchedCountries);
      } catch (error) {
        toast({
          title: 'Error fetching countries',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive'
        });
      }
    }
    fetchCountries();
  }, [toast]);

  const handleAddCountry = async (name: string) => {
    try {
      const newCountry = await addCountry(name);
      setCountries(prev => [...prev, newCountry]);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Country</CardTitle>
        <CardDescription>
          Add a new country to the database, if the country already exists it will throw an error message to the user.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-start">
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Country
          </Button>
        </div>
        <AddCountryDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAddCountry={handleAddCountry}
        />
      </CardContent>
    </Card>
  );
} 