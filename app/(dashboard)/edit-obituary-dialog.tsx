import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Obituary } from '@/lib/db';
import { updateObituary } from '@/lib/db';
const formSchema = z.object({
  reference: z.string().length(8, 'Reference must be 8 characters'),
  surname: z.string().optional(),
  titleId: z.number().optional(),
  givenNames: z.string().optional(),
  maidenName: z.string().optional(),
  birthDate: z.string().optional(),
  birthCityId: z.number().optional(),
  deathDate: z.string().optional(),
  deathCityId: z.number().optional(),
  burialCemetery: z.string().optional(),
  cemeteryId: z.number().optional(),
  place: z.string().optional(),
  periodicalId: z.number().optional(),
  publishDate: z.string().optional(),
  page: z.string().max(8, 'Page must be 8 characters or less').optional(),
  column: z.string().max(8, 'Column must be 8 characters or less').optional(),
  notes: z.string().optional(),
  proofread: z.boolean(),
  proofreadDate: z.string().optional(),
  proofreadBy: z.string().optional(),
  enteredBy: z.string().optional(),
  enteredOn: z.string().optional(),
  editedBy: z.string().optional(),
  editedOn: z.string().optional(),
  fileBoxId: z.number().optional(),
});

interface EditObituaryDialogProps {
  obituary: Obituary | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedObituary: Obituary) => void;
}

export function EditObituaryDialog({ obituary, isOpen, onClose, onSave }: EditObituaryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: obituary ? {
      reference: obituary.reference,
      surname: obituary.surname ?? '',
      titleId: obituary.titleId ?? undefined,
      givenNames: obituary.givenNames ?? '',
      maidenName: obituary.maidenName ?? '',
      birthDate: obituary.birthDate ? obituary.birthDate.toISOString().split('T')[0] : '',
      birthCityId: obituary.birthCityId ?? undefined,
      deathDate: obituary.deathDate ? obituary.deathDate.toISOString().split('T')[0] : '',
      deathCityId: obituary.deathCityId ?? undefined,
      burialCemetery: obituary.burialCemetery ?? '',
      cemeteryId: obituary.cemeteryId ?? undefined,
      place: obituary.place ?? '',
      periodicalId: obituary.periodicalId ?? undefined,
      publishDate: obituary.publishDate ? obituary.publishDate.toISOString().split('T')[0] : '',
      page: obituary.page ?? '',
      column: obituary.column ?? '',
      notes: obituary.notes ?? '',
      proofread: obituary.proofread ?? false,
      proofreadDate: obituary.proofreadDate ? obituary.proofreadDate.toISOString().split('T')[0] : '',
      proofreadBy: obituary.proofreadBy ?? '',
      enteredBy: obituary.enteredBy ?? '',
      enteredOn: obituary.enteredOn ? obituary.enteredOn.toISOString() : '',
      editedBy: obituary.editedBy ?? '',
      editedOn: obituary.editedOn ? obituary.editedOn.toISOString() : '',
      fileBoxId: obituary.fileBoxId ?? undefined,
    } : {},
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!obituary || obituary.id === undefined) {
      throw new Error('Obituary is null or ID is undefined');
    }

    setIsLoading(true);
    try {
      const finalValues = {
        ...values,
        id: obituary.id,
        birthDate: values.birthDate ? new Date(values.birthDate) : null,
        deathDate: values.deathDate ? new Date(values.deathDate) : null,
        publishDate: values.publishDate ? new Date(values.publishDate) : null,
        proofreadDate: values.proofreadDate ? new Date(values.proofreadDate) : null,
        enteredOn: values.enteredOn ? new Date(values.enteredOn) : null,
        editedOn: values.editedOn ? new Date(values.editedOn) : null,
      };

      const updatedObituary = await updateObituary(finalValues);
      onSave(updatedObituary);
      onClose();
    } catch (error) {
      console.error('Failed to update obituary:', error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Obituary</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Add more form fields for all obituary properties */}
            <FormField
              control={form.control}
              name="surname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surname</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ... Add more form fields for other properties ... */}
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
                  <FormLabel>Proofread</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}