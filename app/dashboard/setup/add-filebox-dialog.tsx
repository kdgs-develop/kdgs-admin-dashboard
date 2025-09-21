import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  year: z.number().min(1800, "Year must be after 1800").max(new Date().getFullYear(), "Year cannot be in the future"),
  number: z.number().min(1, "Number must be positive"),
});

type AddFileBoxDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddFileBox: (year: number, number: number) => Promise<void>;
  initialYear?: number;
  initialNumber?: number;
};

function AddFileBoxDialog({ 
  isOpen, 
  onClose, 
  onAddFileBox, 
  initialYear, 
  initialNumber 
}: AddFileBoxDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: initialYear || undefined,
      number: initialNumber || undefined,
    },
  });

  // Update form values when initial values change
  useEffect(() => {
    if (initialYear) {
      form.setValue('year', initialYear);
    }
    if (initialNumber) {
      form.setValue('number', initialNumber);
    }
  }, [initialYear, initialNumber, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onAddFileBox(values.year, values.number);
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: 'Error adding file box',
        description: error instanceof Error ? error.message : 'Failed to add file box',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New File Box</DialogTitle>
          <DialogDescription>
            Add a new file box to the database.
            <span className="block mt-4" />
            <strong>Note: </strong>If the file box already exists, an error message will be shown.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save File Box</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddFileBoxDialog; 