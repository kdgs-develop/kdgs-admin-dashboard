'use client';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  number: z.string().min(1, "Batch number is required"),
});

type EditBatchNumberDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onEditBatchNumber: (number: string) => Promise<void>;
  onDeleteBatchNumber: (id: string) => Promise<void>;
  batchNumber: { id: string; number: string } | null;
};

export default function EditBatchNumberDialog({ 
  isOpen, 
  onClose, 
  onEditBatchNumber, 
  onDeleteBatchNumber, 
  batchNumber 
}: EditBatchNumberDialogProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      number: batchNumber?.number || "",
    },
  });

  React.useEffect(() => {
    if (batchNumber) {
      form.reset({ number: batchNumber.number });
    }
  }, [batchNumber, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!batchNumber) return;
    
    try {
      await onEditBatchNumber(values.number.trim());
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating batch number',
        description: error instanceof Error ? error.message : 'Failed to update batch number',
        variant: 'destructive'
      });
    }
  };

  if (!batchNumber) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Batch Number</DialogTitle>
          <DialogDescription>
            Make changes to the batch number or delete it.
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
            <DialogFooter className="gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the batch number.
                      Any obituaries associated with this batch number will have their batch number removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => batchNumber && onDeleteBatchNumber(batchNumber.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 