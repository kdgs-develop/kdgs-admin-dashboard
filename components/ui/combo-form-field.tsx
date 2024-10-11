import React, { useState, useRef, useCallback } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type ComboboxFormFieldProps = {
  control: any;
  name: string;
  label: string;
  placeholder: string;
  emptyText: string;
  items: { id: number; name: string; province?: string; country?: { name: string } }[];
  onAddItem: (name: string) => Promise<{ id: number; name: string }>;
};

function ComboboxFormField({
  control,
  name,
  label,
  placeholder,
  emptyText,
  items,
  onAddItem,
}: ComboboxFormFieldProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const commandRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTimeout(() => {
        commandRef.current?.querySelector('input')?.focus();
      }, 0);
    }
  }, []);

  const handleAddItem = async () => {
    if (inputValue.trim()) {
      try {
        const newItem = await onAddItem(inputValue.trim());
        setInputValue("");
        return newItem;
      } catch (error) {
        console.error('Error adding item:', error);
        toast({
          title: "Error",
          description: "Failed to add new item. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className="text-xs">{label}</FormLabel>
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    "w-full justify-between h-8 text-sm",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  {field.value
                    ? items.find((item) => item.id === field.value)?.name
                    : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent 
              className="w-full p-0 z-50" 
              style={{ pointerEvents: 'auto' }}
              onInteractOutside={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
            >
              <Command ref={commandRef}>
                <CommandInput 
                  placeholder={`Search ${label.toLowerCase()}...`} 
                  value={inputValue}
                  onValueChange={setInputValue}
                />
                <CommandList>
                  <CommandEmpty className="flex flex-col items-left">
                    {emptyText}
                    <Button
                      type="button"
                      size="sm"
                      className="m-5"
                      onClick={async () => {
                        const newItem = await handleAddItem();
                        if (newItem) {
                          field.onChange(newItem.id);
                          setOpen(false);
                        }
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{inputValue}"
                    </Button>
                  </CommandEmpty>
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        value={item.name}
                        key={item.id}
                        onSelect={() => {
                          field.onChange(item.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            item.id === field.value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {item.name}, {item?.province}, {item?.country?.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default ComboboxFormField;