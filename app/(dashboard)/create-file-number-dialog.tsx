'use client';

import { Button } from '@/components/ui/button';
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
import { toast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  createImageFileAction,
  createObituaryAction,
  generateNewFileNumber,
  generateReference,
  obituaryExists as obituaryExistsCheck
} from './actions';
import { fetchImagesForObituaryAction } from './obituary/[reference]/actions';

const formSchema = z.object({
  surname: z.string().min(1, 'Surname is required'),
  givenNames: z.string().min(1, 'Given names are required'),
  deathDate: z.date({
    required_error: 'Death date is required'
  })
});

type CreateFileNumberDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function CreateFileNumberDialog({
  isOpen,
  onClose
}: CreateFileNumberDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileNumber, setFileNumber] = useState('');
  const [obituaryExists, setObituaryExists] = useState(false);
  const [relatedImages, setRelatedImages] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      surname: '',
      givenNames: '',
      deathDate: undefined
    }
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        surname: '',
        givenNames: '',
        deathDate: undefined
      });
      setFileNumber('');
      setObituaryExists(false);
    }
  }, [isOpen, form]);

  const handleGenerateFileNumber = async () => {
    const { surname, givenNames, deathDate } = form.getValues();
    let newFileNumber: string;

    if (surname && givenNames && deathDate) {
      const existingObituary = await obituaryExistsCheck(
        surname,
        givenNames,
        deathDate
      );

      setObituaryExists(existingObituary.length > 0);

      if (existingObituary) {
        newFileNumber = await generateNewFileNumber(
          surname,
          givenNames,
          deathDate
        );
        // Fetch related images
        const images = await fetchImagesForObituaryAction(
          existingObituary[0].reference
        );
        setRelatedImages(images);
      } else {
        newFileNumber = await generateReference(surname);
        setRelatedImages([]);
      }
      setFileNumber(newFileNumber);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    const { surname, givenNames, deathDate } = values;

    try {
      if (!obituaryExists) {
        await createObituaryAction({
          reference: fileNumber,
          surname: surname,
          givenNames: givenNames,
          deathDate: deathDate
        });
      }
      await createImageFileAction(fileNumber);

      onClose();
      toast({
        title: obituaryExists ? 'File Number Added' : 'File Number Created',
        description: `New file number ${fileNumber} has been ${obituaryExists ? 'added to the existing obituary' : 'created'}.`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create file number. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create File Number</DialogTitle>
          <DialogDescription>
            Enter the required information to generate a new file number.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <FormField
              control={form.control}
              name="givenNames"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Given Names</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deathDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Death Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} setDate={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center space-x-2">
              <Input
                value={fileNumber}
                readOnly
                placeholder="Generated File Number"
              />
              <Button type="button" onClick={handleGenerateFileNumber}>
                Generate
              </Button>
            </div>
            {obituaryExists && (
              <div className="space-y-2">
                <p className="text-sm text-yellow-600">
                  The File Number will be added to the existing Obituary
                </p>
                <div className="text-sm">
                  <h4 className="font-semibold">Related Images:</h4>
                  {relatedImages.length > 0 ? (
                    <ul className="list-disc pl-5 max-h-40 overflow-y-auto">
                      {relatedImages.map((image, index) => (
                        <li key={index}>{image}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No images related to this obituary.</p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isLoading || !fileNumber}>
                {isLoading ? 'Creating...' : 'Create File Number'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
