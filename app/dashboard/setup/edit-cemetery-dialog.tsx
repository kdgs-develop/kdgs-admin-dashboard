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
import { Button } from "@/components/ui/button";
import ComboboxFormField from "@/components/ui/combo-form-field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
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
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Cemetery name is required"),
  cityId: z.number().min(1, "City is required")
});

type EditCemeteryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onEditCemetery: (
    id: number,
    name: string | null,
    cityId: number
  ) => Promise<void>;
  onDeleteCemetery: (id: number) => Promise<void>;
  cemetery: {
    id: number;
    name: string | null;
    city: { id: number; name: string; country: { name: string } };
  } | null;
  cities: {
    id: number;
    name: string;
    province?: string | null;
    country: { name: string };
  }[];
};

function EditCemeteryDialog({
  isOpen,
  onClose,
  onEditCemetery,
  onDeleteCemetery,
  cemetery,
  cities = []
}: EditCemeteryDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: cemetery?.name || "",
      cityId: cemetery?.city?.id || 0
    }
  });

  useEffect(() => {
    if (cemetery) {
      form.reset({
        name: cemetery.name || "",
        cityId: cemetery.city?.id || 0
      });
    }
  }, [cemetery, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (cemetery) {
      await onEditCemetery(cemetery.id, values.name, values.cityId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Interment Place</DialogTitle>
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
              placeholder="Select a city"
              emptyText="No city found."
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
            <DialogFooter className="flex justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the cemetery.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cemetery && onDeleteCemetery(cemetery.id)}
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

export { EditCemeteryDialog };
