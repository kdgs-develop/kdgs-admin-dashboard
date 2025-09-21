'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required')
});

type AddRelationshipDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddRelationship: (name: string, category: string) => Promise<void>;
  initialName?: string;
};

function AddRelationshipDialog({
  isOpen,
  onClose,
  onAddRelationship,
  initialName
}: AddRelationshipDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName || '',
      category: 'Immediate Family'
    }
  });

  useEffect(() => {
    if (initialName) {
      form.setValue('name', initialName);
    }
  }, [initialName, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onAddRelationship(values.name, values.category);
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: 'Error adding relationship',
        description:
          error instanceof Error ? error.message : 'Failed to add relationship',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Family Relationship</DialogTitle>
          <DialogDescription>
            Add a new family relationship to the database.
          </DialogDescription>
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Immediate Family">
                        Immediate Family
                      </SelectItem>
                      <SelectItem value="Extended Family">
                        Extended Family
                      </SelectItem>
                      <SelectItem value="In-Laws">In-Laws</SelectItem>
                      <SelectItem value="Step Family">Step Family</SelectItem>
                      <SelectItem value="Foster/Adoptive Family">
                        Foster/Adoptive Family
                      </SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                      <SelectItem value="Optional Extensions">
                        Optional Extensions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Relationship</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddRelationshipDialog;
