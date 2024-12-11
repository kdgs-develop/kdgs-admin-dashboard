import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
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

function AddCemeteryDialog({
  isOpen,
  onClose,
  onAddCemetery,
  cities,
  initialValues
}: AddCemeteryDialogProps) {
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await onAddCemetery(values.name, parseInt(values.cityId));
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Cemetery</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cemetery Name</FormLabel>
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
                  <FormLabel>City</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}{' '}
                          {city.country ? `(${city.country.name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

export { AddCemeteryDialog };
