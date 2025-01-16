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
import { toast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  number: z.string().min(1, 'Batch number is required')
});

interface AddBatchNumberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (batchNumber: string) => Promise<void>;
  initialNumber?: string;
}

export function AddBatchNumberDialog({
  isOpen,
  onClose,
  onAdd,
  initialNumber
}: AddBatchNumberDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: initialNumber || ''
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onAdd(values.number);
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create batch number',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Batch Number</DialogTitle>
          <DialogDescription>
            Enter a new batch number to create.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create Batch Number</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 