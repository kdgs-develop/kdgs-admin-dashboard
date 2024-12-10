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

type EditFileBoxDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onEditFileBox: (year: number, number: number) => Promise<void>;
  fileBox: { id: number; year: number; number: number } | null;
};

function EditFileBoxDialog({ isOpen, onClose, onEditFileBox, fileBox }: EditFileBoxDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: fileBox?.year,
      number: fileBox?.number,
    },
  });

  useEffect(() => {
    if (fileBox) {
      form.reset({
        year: fileBox.year,
        number: fileBox.number,
      });
    }
  }, [fileBox, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onEditFileBox(values.year, values.number);
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating file box',
        description: error instanceof Error ? error.message : 'Failed to update file box',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit File Box</DialogTitle>
          <DialogDescription>
            Update the year and number for this file box.
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
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EditFileBoxDialog;