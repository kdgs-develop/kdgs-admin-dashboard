import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Cemetery name is required'),
  cityId: z.string().min(1, 'City is required')
});

type AddCemeteryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddCemetery: (name: string | null, cityId: number) => Promise<void>;
  cities: { id: number; name: string; country?: { name: string } }[];
  initialValues?: {
    name?: string;
    cityId?: string;
  };
};

type City = {
  id?: number | null;
  name?: string | null;
  country?: { name: string } | null;
} | null;

export function AddCemeteryDialog({ isOpen, onClose, onAddCemetery, cities, initialValues }: AddCemeteryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filteredCities, setFilteredCities] = useState<typeof cities>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || '',
      cityId: initialValues?.cityId || ''
    }
  });

  React.useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name || '',
        cityId: initialValues.cityId || ''
      });
    }
  }, [initialValues, form]);

  React.useEffect(() => {
    if (!Array.isArray(cities)) {
      setFilteredCities([]);
      return;
    }

    if (search) {
      setFilteredCities(
        cities.filter((city) => {
          if (!city) return false;
          
          const cityName = (city.name || '').toLowerCase();
          const countryName = (city.country?.name || '').toLowerCase();
          const searchTerm = search.toLowerCase();
          
          return cityName.includes(searchTerm) || countryName.includes(searchTerm);
        })
      );
    } else {
      setFilteredCities(cities);
    }
  }, [search, cities]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await onAddCemetery(values.name, parseInt(values.cityId));
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Interment Place</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? cities.find((city) => city.id.toString() === field.value)?.name
                            : "Select city..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <div className="flex flex-col">
                        <div className="border-b p-2">
                          <Input
                            placeholder="Search city..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          />
                        </div>
                        <Command shouldFilter={false}>
                          <CommandList>
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto p-1">
                              {(filteredCities || []).map((city) => {
                                if (!city?.id) return null;
                                return (
                                  <CommandItem
                                    key={city.id}
                                    value={city.id.toString()}
                                    onSelect={() => {
                                      form.setValue("cityId", city.id.toString());
                                      setSearch("");
                                      setOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        form.getValues("cityId") === city.id.toString() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {city.name ?? 'Unnamed'} {city.country?.name ? `(${city.country.name})` : ''}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add Cemetery</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
