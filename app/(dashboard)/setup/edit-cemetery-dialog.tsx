import React, { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Cemetery name is required"),
  cityId: z.string().min(1, "City is required"),
});

type EditCemeteryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onEditCemetery: (id: number, name: string | null, cityId: number) => Promise<void>;
  onDeleteCemetery: (id: number) => Promise<void>;
  cemetery: { id: number; name: string | null; city: { id: number; name: string; country: { name: string } } } | null;
  cities: { id: number; name: string; country: { name: string } }[];
};

function EditCemeteryDialog({ isOpen, onClose, onEditCemetery, onDeleteCemetery, cemetery, cities }: EditCemeteryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filteredCities, setFilteredCities] = React.useState(cities);

  React.useEffect(() => {
    if (search) {
      setFilteredCities(
        cities.filter((city) => 
          city.name?.toLowerCase().includes(search.toLowerCase()) ||
          city.country?.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      setFilteredCities(cities);
    }
  }, [search, cities]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: cemetery?.name || "",
      cityId: cemetery?.city?.id.toString() || "",
    },
  });

  useEffect(() => {
    if (cemetery) {
      form.reset({
        name: cemetery.name || "",
        cityId: cemetery.city?.id.toString() || "",
      });
    }
  }, [cemetery, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (cemetery) {
      await onEditCemetery(
        cemetery.id,
        values.name,
        parseInt(values.cityId)
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Cemetery</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cemetery Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? cities.find((city) => city.id.toString() === field.value)?.name
                            : "Select city..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-[400px] p-0" 
                      align="start"
                      side="bottom"
                      sideOffset={4}
                    >
                      <Command>
                        <CommandInput 
                          placeholder="Search city..." 
                          onValueChange={setSearch}
                        />
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandGroup>
                          {filteredCities.map((city) => (
                            <CommandItem
                              key={city.id}
                              onSelect={() => {
                                form.setValue("cityId", city.id.toString());
                                setOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === city.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {city.name || 'Unnamed'} {city.country ? `(${city.country.name})` : ''}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
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
                      This action cannot be undone. This will permanently delete the cemetery.
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