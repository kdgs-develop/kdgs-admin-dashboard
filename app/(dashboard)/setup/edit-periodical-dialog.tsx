import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { CityWithRelations, PeriodicalWithRelations } from "@/types/prisma";
import ComboboxFormField from "@/components/ui/combo-form-field";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().optional(),
  cityId: z.number().nullable().optional()
});

type EditPeriodicalDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onEditPeriodical: (
    name: string,
    url?: string | null,
    cityId?: number | null
  ) => Promise<void>;
  onDeletePeriodical: (id: number) => Promise<void>;
  periodical: PeriodicalWithRelations | null;
  cities: CityWithRelations[];
};

function EditPeriodicalDialog({ 
  isOpen, 
  onClose, 
  onEditPeriodical, 
  onDeletePeriodical, 
  periodical,
  cities 
}: EditPeriodicalDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: periodical?.name || "",
      url: periodical?.url || "",
      cityId: periodical?.cityId || null
    }
  });

  useEffect(() => {
    if (periodical) {
      form.reset({
        name: periodical.name || "",
        url: periodical.url || "",
        cityId: periodical.cityId || null
      });
    }
  }, [periodical, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onEditPeriodical(values.name, values.url, values.cityId);
      onClose();
    } catch (error) {
      toast({
        title: "Error updating periodical",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update periodical",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Publication</DialogTitle>
          <DialogDescription>
            Update the information for this publication.
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
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ComboboxFormField
              control={form.control}
              name="cityId"
              label="Location (Optional)"
              placeholder="Select a location"
              emptyText="No location found."
              items={cities.map(city => ({
                id: city.id,
                name: city.name ?? "",
                city: {
                  name: city.name ?? "",
                province: city.province ?? undefined,
                country: city.country
                  ? { name: city.country.name }
                  : undefined
                }
              }))}
            />
            <DialogFooter className="flex justify-between items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the publication.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        periodical && onDeletePeriodical(periodical.id)
                      }
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EditPeriodicalDialog; 
