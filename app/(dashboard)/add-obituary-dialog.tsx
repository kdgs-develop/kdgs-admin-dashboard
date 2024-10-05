'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ComboboxFormField from '@/components/ui/combo-form-field';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { ToastAction } from '@/components/ui/toast';
import { toast } from '@/hooks/use-toast';
import { Obituary } from '@/lib/db';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  addCity,
  addPeriodical,
  addTitle,
  createObituaryAction,
  generateReference,
  obituaryExists
} from './actions';

// Use the same formSchema as in EditObituaryDialog
const formSchema = z.object({
  reference: z.string().length(8, 'Reference must be 8 characters'),
  surname: z.string().optional(),
  titleId: z.number().optional(),
  givenNames: z.string().optional(),
  maidenName: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  birthCityId: z.number().optional(),
  deathDate: z.coerce.date().optional(),
  deathCityId: z.number().optional(),
  burialCemetery: z.string().optional(),
  cemeteryId: z.number().optional(),
  place: z.string().optional(),
  periodicalId: z.number().optional(),
  publishDate: z.coerce.date().optional(),
  page: z.string().max(8, 'Page must be 8 characters or less').optional(),
  column: z.string().max(8, 'Column must be 8 characters or less').optional(),
  notes: z.string().optional(),
  proofread: z.boolean(),
  proofreadDate: z.coerce.date().optional(),
  proofreadBy: z.string().optional(),
  enteredBy: z.string().optional(),
  enteredOn: z.coerce.date().optional(),
  editedBy: z.string().optional(),
  editedOn: z.coerce.date().optional(),
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
  role: string | null;
  currentUserFullName: string;
};

export function AddObituaryDialog({
  isOpen,
  onClose,
  onSave,
  titles,
  cities,
  periodicals,
  fileBoxes,
  role,
  currentUserFullName
}: AddObituaryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [reference, setReference] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  // File upload
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{ file: File; newName: string }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localTitles, setLocalTitles] = useState(titles);
  const [localCities, setLocalCities] = useState(cities);
  const [localPeriodicals, setLocalPeriodicals] = useState(periodicals);

  const generateNewFileName = (
    reference: string,
    index: number,
    fileName: string
  ) => {
    const extension = fileName.split('.').pop();
    if (index === 0) {
      return `${reference}.${extension}`;
    }
    const letter = String.fromCharCode(97 + index - 1); // 'a' for the second file, 'b' for the third, etc.
    return `${reference}${letter}.${extension}`;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map((file, index) => ({
      file,
      newName: generateNewFileName(
        reference,
        selectedFiles.length + index,
        file.name
      )
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFileNames = (reference: string) => {
    setSelectedFiles((prev) =>
      prev.map((item, index) => ({
        ...item,
        newName: generateNewFileName(reference, index, item.file.name)
      }))
    );
  };

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
      enteredBy: currentUserFullName || '',
      enteredOn: new Date(), // Set current date as default
      editedBy: '',
      editedOn: undefined,
      fileBoxId: undefined,
      relatives: []
    }
  });

  const handleGenerateReference = async () => {
    const surname = form.getValues('surname');
    const givenNames = form.getValues('givenNames');
    const deathDate = form.getValues('deathDate');

    if (surname && givenNames && deathDate) {
      const obituaryAlreadyExists = await obituaryExists(
        surname,
        givenNames,
        deathDate
      );

      if (obituaryAlreadyExists) {
        toast({
          title: 'Obituary Exists',
          description:
            'An obituary with the same surname, given names, and death date already exists.',
          variant: 'destructive',
          duration: Infinity,
          action: <ToastAction altText="Close">Close</ToastAction>
        });
        return;
      } else {
        const newReference = await generateReference(surname);
        form.setValue('reference', newReference);
        setReference(newReference);
        updateFileNames(newReference);
      }
    }
  };

  // ... (previous imports)

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const { relatives, ...rest } = values;

      const formattedRelatives = relatives?.map((relative) => ({
        surname: relative.surname,
        givenNames: relative.givenNames,
        relationship: relative.relationship,
        predeceased: relative.predeceased
      }));

      // Create the obituary
      let newObituary;
      try {
        newObituary = await createObituaryAction({
          ...rest,
          relatives: formattedRelatives || []
        });
      } catch (error) {
        console.error('Failed to create obituary:', error);
        toast({
          title: 'Obituary Creation Error',
          description: 'Failed to create the obituary. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Upload files
      if (selectedFiles.length > 0) {
        try {
          const formData = new FormData();
          selectedFiles.forEach((fileItem) => {
            formData.append('files', fileItem.file, fileItem.newName);
          });

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('File upload failed');
          }
        } catch (error) {
          console.error('Failed to upload files:', error);
          toast({
            title: 'File Upload Error',
            description:
              'Obituary created successfully, but file upload failed. Please try uploading the files again.',
            variant: 'destructive'
          });
          onSave(newObituary);
          onClose();
          return;
        }
      }

      onSave(newObituary);
      onClose();
      toast({
        title: 'Obituary created',
        description:
          'Your new obituary has been created successfully with all files uploaded.'
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Obituary</DialogTitle>
          <DialogDescription>
            To generate a new File Number the surname, given names, and death date are needed.
            <div className="h-1" />
            <strong>Please note:</strong> We recommend using the search bar to look for any matching records in
            our existing index before creating a new obituary.
          </DialogDescription>
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
                          disabled={
                            !form.getValues('surname') ||
                            !form.getValues('givenNames') ||
                            !form.getValues('deathDate')
                          }
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
                <ComboboxFormField
                  control={form.control}
                  name="titleId"
                  label="Title"
                  placeholder="Select a title"
                  emptyText="No title found."
                  items={localTitles}
                  onAddItem={async (name) => {
                    const newTitle = await addTitle(name);
                    setLocalTitles([
                      ...localTitles,
                      { id: newTitle.id, name: newTitle?.name! }
                    ]);
                    return { id: newTitle.id, name: newTitle?.name! };
                  }}
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
                <ComboboxFormField
                  control={form.control}
                  name="birthCityId"
                  label="Birth City"
                  placeholder="Select a city"
                  emptyText="No city found."
                  items={localCities}
                  onAddItem={async (name) => {
                    const newCity = await addCity(name);
                    setLocalCities([
                      ...localCities,
                      {
                        id: newCity?.id!,
                        name: newCity?.name!,
                        province: newCity?.province,
                        country: newCity?.countryId! as unknown as {
                          name: string;
                        }
                      }
                    ]);
                    return {
                      id: newCity.id,
                      name: newCity?.name!,
                      province: newCity?.province,
                      country: newCity?.countryId!
                    };
                  }}
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
                <ComboboxFormField
                  control={form.control}
                  name="deathCityId"
                  label="Death City"
                  placeholder="Select a city"
                  emptyText="No city found."
                  items={localCities}
                  onAddItem={async (name) => {
                    const newCity = await addCity(name);
                    setLocalCities([
                      ...localCities,
                      {
                        id: newCity?.id!,
                        name: newCity?.name!,
                        province: newCity?.province,
                        country: newCity?.countryId! as unknown as {
                          name: string;
                        }
                      }
                    ]);
                    return {
                      id: newCity.id,
                      name: newCity?.name!,
                      province: newCity?.province,
                      country: newCity?.countryId!
                    };
                  }}
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

            {/* Obituary Files */}
            <div className="space-y-2">
              <FormLabel className="text-xs">Obituary Images</FormLabel>
              {selectedFiles.length > 0 && (
                <div className="mb-2 space-y-2">
                  {selectedFiles.map((fileItem, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>
                        {fileItem.file.name} → {fileItem.newName}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={!reference}
                  multiple
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!reference}
                >
                  Add New Image File
                </Button>
              </div>
            </div>

            {/* Publication Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <ComboboxFormField
                  control={form.control}
                  name="periodicalId"
                  label="Periodical"
                  placeholder="Select a periodical"
                  emptyText="No periodical found."
                  items={localPeriodicals}
                  onAddItem={async (name) => {
                    const newPeriodical = await addPeriodical(name);
                    setLocalPeriodicals([
                      ...localPeriodicals,
                      { id: newPeriodical.id, name: newPeriodical?.name! }
                    ]);
                    return { id: newPeriodical.id, name: newPeriodical?.name! };
                  }}
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
              <FormLabel className="text-xs flex">Relatives</FormLabel>
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
                          disabled={role !== 'ADMIN' && role !== 'PROOFREADER'}
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
                      {role === 'ADMIN' || role === 'PROOFREADER' ? (
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      ) : (
                        <Input type="date" className="h-8 text-sm" disabled />
                      )}
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
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          disabled={role !== 'ADMIN' && role !== 'PROOFREADER'}
                        />
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
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          value={field.value || currentUserFullName || ''}
                        />
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
                      <DatePicker
                        date={field.value}
                        setDate={(date) => field.onChange(date)}
                      />
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
                        <Input
                          {...field}
                          className="h-8 text-sm"
                          disabled={role !== 'ADMIN'}
                        />
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
                      {role === 'ADMIN' ? (
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                      ) : (
                        <Input type="date" className="h-8 text-sm" disabled />
                      )}
                      <FormMessage />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* File Box */}

            <ComboboxFormField
              control={form.control}
              name="fileBoxId"
              label="File Box"
              placeholder="Select a file box"
              emptyText="No file box found."
              items={fileBoxes.map((box) => ({
                id: box.id,
                name: `Year: ${box.year}, Number: ${box.number}`
              }))}
              onAddItem={async (name) => {
                // Since file boxes are typically managed differently,
                // we'll just return the existing items for now.
                // You may want to implement a proper addFileBox function if needed.
                toast({
                  title: 'Cannot add new file box',
                  description:
                    'File boxes are managed separately. Please contact an administrator.',
                  variant: 'destructive'
                });
                const tempId = Date.now();
                return { id: tempId, name };
              }}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  isLoading || isSuccess || !form.getValues('reference')
                }
              >
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
