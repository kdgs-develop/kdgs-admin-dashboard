import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ComboboxFormField from "@/components/ui/combo-form-field";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Cemetery name is required"),
  cityId: z.number().min(1, "City is required")
});

type AddCemeteryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddCemetery: (name: string | null, cityId: number) => Promise<void>;
  cities: {
    id: number;
    name: string;
    province?: string | null;
    country?: { name: string };
  }[];
  initialValues?: {
    name?: string;
    cityId?: number;
  };
};

export function AddCemeteryDialog({
  isOpen,
  onClose,
  onAddCemetery,
  cities,
  initialValues
}: AddCemeteryDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      cityId: initialValues?.cityId || undefined
    }
  });

  React.useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name || "",
        cityId: initialValues.cityId || undefined
      });
    }
  }, [initialValues, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await onAddCemetery(values.name, values.cityId);
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
            <ComboboxFormField
              control={form.control}
              name="cityId"
              label="Location"
              placeholder="Select location..."
              emptyText="No location found."
              items={cities.map(city => ({
                id: city.id,
                name: city.name,
                city: {
                  name: city.name,
                  province: city.province ?? undefined,
                  country: city.country
                    ? { name: city.country.name }
                    : undefined
                }
              }))}
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
