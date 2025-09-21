"use client";

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
import { useEffect } from "react";
import { CityWithRelations } from "@/types/prisma";
import ComboboxFormField from "@/components/ui/combo-form-field";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().optional(),
  cityId: z.number().nullable().optional()
});

type AddPeriodicalDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddPeriodical: (
    name: string,
    url?: string | null,
    cityId?: number | null
  ) => Promise<void>;
  initialName?: string;
  cities: CityWithRelations[];
};

function AddPeriodicalDialog({
  isOpen,
  onClose,
  onAddPeriodical,
  initialName,
  cities
}: AddPeriodicalDialogProps) {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialName || ""
    }
  });

  useEffect(() => {
    if (initialName) {
      form.setValue("name", initialName);
    }
  }, [initialName, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onAddPeriodical(values.name, values.url, values.cityId);
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error adding periodical",
        description:
          error instanceof Error ? error.message : "Failed to add periodical",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Publication</DialogTitle>
          <DialogDescription>
            Add a new publication to the database.
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
            <DialogFooter>
              <Button type="submit">Save Periodical</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddPeriodicalDialog; 
