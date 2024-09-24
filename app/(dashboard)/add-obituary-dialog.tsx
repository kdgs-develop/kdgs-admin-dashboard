'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Obituary } from '@/lib/db';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { createObituaryAction, generateReference } from './actions';
import { toast } from '@/hooks/use-toast';
import { Prisma } from '@prisma/client';

// Use the same formSchema as in EditObituaryDialog
const formSchema = z.object({
  reference: z.string().length(8, 'Reference must be 8 characters'),
  surname: z.string().optional(),
  titleId: z.number().optional(),
  givenNames: z.string().optional(),
  maidenName: z.string().optional(),
  birthDate: z.date().optional(),
  birthCityId: z.number().optional(),
  deathDate: z.date().optional(),
  deathCityId: z.number().optional(),
  burialCemetery: z.string().optional(),
  cemeteryId: z.number().optional(),
  place: z.string().optional(),
  periodicalId: z.number().optional(),
  publishDate: z.date().optional(),
  page: z.string().max(8, 'Page must be 8 characters or less').optional(),
  column: z.string().max(8, 'Column must be 8 characters or less').optional(),
  notes: z.string().optional(),
  proofread: z.boolean(),
  proofreadDate: z.date().optional(),
  proofreadBy: z.string().optional(),
  enteredBy: z.string().optional(),
  enteredOn: z.date().optional(),
  editedBy: z.string().optional(),
  editedOn: z.date().optional(),
  fileBoxId: z.number().optional(),
  relatives: z
    .array(
      z.object({
        surname: z.string().optional(),
        givenNames: z.string().optional(),
        relationship: z.string().optional(),
        predeceased: z.boolean().default(false)
      })
    )
    .optional()
});

type AddObituaryDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (obituary: Obituary) => void;
  titles: { id: number; name: string }[];
  cities: {
    id: number;
    name: string;
    province: string | null;
    country: { name: string } | null;
  }[];
  periodicals: { id: number; name: string }[];
  fileBoxes: { id: number; year: number; number: number }[];
};

export function AddObituaryDialog({
  isOpen,
  onClose,
  onSave,
  titles,
  cities,
  periodicals,
  fileBoxes
}: AddObituaryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reference, setReference] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reference: '',
      surname: '',
      titleId: undefined,
      givenNames: '',
      maidenName: '',
      birthDate: undefined,
      birthCityId: undefined,
      deathDate: undefined,
      deathCityId: undefined,
      burialCemetery: '',
      cemeteryId: undefined,
      place: '',
      periodicalId: undefined,
      publishDate: undefined,
      page: '',
      column: '',
      notes: '',
      proofread: false,
      proofreadDate: undefined,
      proofreadBy: '',
      enteredBy: '',
      enteredOn: new Date(),
      editedBy: '',
      editedOn: undefined,
      fileBoxId: undefined,
      relatives: undefined
    }
  });

  const handleGenerateReference = async () => {
    const surname = form.getValues('surname');
    if (surname) {
      const newReference = await generateReference(surname);
      form.setValue('reference', newReference);
      setReference(newReference);
    }
  };

  // ... (previous imports)

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const { relatives, ...rest } = values;
  
      const formattedRelatives = relatives?.map(relative => ({
        surname: relative.surname,
        givenNames: relative.givenNames,
        relationship: relative.relationship,
        predeceased: relative.predeceased
      }));
  
      const newObituary = await createObituaryAction({
        ...rest,
        relatives: formattedRelatives || []
      });
  
      onSave(newObituary);
      onClose();
      toast({
        title: "Obituary created",
        description: "Your new obituary has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating obituary:', error);
      toast({
        title: "Error",
        description: "There was a problem creating the obituary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render form fields similar to EditObituaryDialog

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Obituary</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Render form fields here */}
            <div className="grid grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">File Number</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input {...field} className="h-8 text-sm" readOnly />
                        </FormControl>
                        <Button
                          type="button"
                          onClick={handleGenerateReference}
                          disabled={!form.getValues('surname')}
                        >
                          Generate
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Surname</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="titleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Title</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select a title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {titles.map((title) => (
                            <SelectItem
                              key={title.id}
                              value={title.id.toString()}
                            >
                              {title.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="givenNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Given Names</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maidenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Maiden Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dates and Location Information */}
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Birth Date</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthCityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Birth City</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select a city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem
                              key={city.id}
                              value={city.id.toString()}
                            >
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deathDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Death Date</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deathCityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Death City</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select a city" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem
                              key={city.id}
                              value={city.id.toString()}
                            >
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="burialCemetery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Burial Cemetery</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Publication Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="periodicalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Periodical</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select a periodical" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periodicals.map((periodical) => (
                            <SelectItem
                              key={periodical.id}
                              value={periodical.id.toString()}
                            >
                              {periodical.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="publishDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Publish Date</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="page"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Page</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="column"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Column</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="place"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Place</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="h-20 text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Relatives */}
            <div className="space-y-2">
              <FormLabel className="text-xs">Relatives</FormLabel>
              {form.watch('relatives')?.map((_, index) => (
                <div key={index} className="flex items-end space-x-2">
                  <FormField
                    control={form.control}
                    name={`relatives.${index}.surname`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Surname</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8 text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`relatives.${index}.givenNames`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Given Names</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8 text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`relatives.${index}.relationship`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Relationship</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8 text-sm" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`relatives.${index}.predeceased`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-xs">Predeceased</FormLabel>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const relatives = form.getValues('relatives');
                      relatives?.splice(index, 1);
                      form.setValue('relatives', relatives || []);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const relatives = form.getValues('relatives') || [];
                  form.setValue('relatives', [
                    ...relatives,
                    {
                      surname: '',
                      givenNames: '',
                      relationship: '',
                      predeceased: false
                    }
                  ]);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Relative
              </Button>
            </div>

            {/* Proofread Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="proofread"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-xs">Proofread</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="proofreadDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Proofread Date</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="proofreadBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Proofread By</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="enteredBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Entered By</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enteredOn"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Entered On</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="editedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Edited By</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="editedOn"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs">Edited On</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* File Box */}
            <FormField
              control={form.control}
              name="fileBoxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">File Box</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select a file box" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fileBoxes.map((fileBox) => (
                        <SelectItem
                          key={fileBox.id}
                          value={fileBox.id.toString()}
                        >
                          {`Year: ${fileBox.year}, Number: ${fileBox.number}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading || isSuccess}>
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Creating...
                  </>
                ) : isSuccess ? (
                  'Created Successfully!'
                ) : (
                  'Create Obituary'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
