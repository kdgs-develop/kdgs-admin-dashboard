import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from './form';

type ComboboxFormFieldProps = {
  control: any;
  name: string;
  label: string;
  placeholder: string;
  emptyText: string;
  items: {
    id: number | string;
    name: string | null;
    province?: string;
    country?: { name: string };
    city?: {
      name: string | null;
      province?: string;
      country?: { name: string };
    };
  }[];
  onAddItem?: (name: string) => Promise<{
    id: number | string;
    name: string;
    province?: string;
    country?: { name: string };
    city?: { name: string };
  }>;
};

function ComboboxFormField({
  control,
  name,
  label,
  placeholder,
  emptyText,
  items,
  onAddItem
}: ComboboxFormFieldProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listbox = commandRef.current?.querySelector('[role="listbox"]');
    if (listbox) {
      listbox.scrollTop = 0;
    }
  }, [inputValue]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTimeout(() => {
        commandRef.current?.querySelector('input')?.focus();
      }, 0);
    }
  }, []);

  // const handleAddItem = async () => {
  //   if (inputValue.trim()) {
  //     try {
  //       const newItem = await onAddItem(inputValue.trim());
  //       setInputValue("");
  //       return newItem;
  //     } catch (error) {
  //       console.error('Error adding item:', error);
  //       toast({
  //         title: "Error",
  //         description: "Failed to add new item. Please try again.",
  //         variant: "destructive",
  //       });
  //     }
  //   }
  // };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col self-end">
          <FormLabel className="text-xs mb-[3px]">{label}</FormLabel>
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className={cn(
                    'max-w-md justify-between h-8 text-sm',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value
                    ? items.find((item) => item.id === field.value)
                      ? [
                          items.find((item) => item.id === field.value)?.name,
                          items.find((item) => item.id === field.value)
                            ?.province,
                          items.find((item) => item.id === field.value)?.country
                            ?.name,
                          items.find((item) => item.id === field.value)?.city
                            ?.name,
                          items.find((item) => item.id === field.value)?.city
                            ?.province,
                          items.find((item) => item.id === field.value)?.city
                            ?.country?.name
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : placeholder
                    : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              className="w-min-fit p-0 z-50"
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
                    {/* <Button
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
                      Create a new location
                    </Button> */}
                  </CommandEmpty>
                  <CommandGroup className="h-[200px] overflow-y-auto" onWheel={(e) => {
                    e.currentTarget.scrollTop += e.deltaY;
                  }}>
                    <CommandItem
                      value="None"
                      onSelect={() => {
                        field.onChange(null);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          field.value === undefined || null ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      None
                    </CommandItem>
                    {items.map((item) => (
                      <CommandItem
                        value={[
                          item?.name,
                          item?.province,
                          item?.country?.name,
                          item?.city?.name,
                          item?.city?.province,
                          item?.city?.country?.name
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        key={item.id}
                        onSelect={() => {
                          field.onChange(item.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            item.id === field.value
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {[
                          item?.name,
                          item?.province,
                          item?.country?.name,
                          item?.city?.name,
                          item?.city?.province,
                          item?.city?.country?.name
                        ]
                          .filter(Boolean)
                          .join(', ')}
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
