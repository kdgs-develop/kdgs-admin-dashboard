'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type AddTitleDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddTitle: (name: string) => Promise<void>;
  initialName?: string;
};

export default function AddTitleDialog({ isOpen, onClose, onAddTitle, initialName }: AddTitleDialogProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName || '',
    },
  });

  useEffect(() => {
    if (initialName) {
      form.reset({ name: initialName });
    }
  }, [initialName, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onAddTitle(values.name);
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: 'Error adding title',
        description: error instanceof Error ? error.message : 'Failed to add title',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Title</DialogTitle>
          <DialogDescription>
            Enter a name for the new title.
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
                    <Input {...field} placeholder="Enter title name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add Title</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 