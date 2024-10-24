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
import { Eye } from 'lucide-react';
import { BucketItem } from 'minio';
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
import { getImageUrlAction } from './images/minio-actions';
import { ViewImageDialog } from './images/view-image-dialog';
import { fetchImagesForObituaryAction } from './obituary/[reference]/actions';

const formSchema = z.object({
  surname: z
    .string()
    .min(1, 'Surname is required')
    .transform((val) => val.toUpperCase()),
  givenNames: z
    .string()
    .min(1, 'Given names are required')
    .transform((val) =>
      val
        .split(' ')
        .map(
          (name) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
        )
        .join(' ')
    ),
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
  const [selectedImage, setSelectedImage] = useState<BucketItem | null>(null);
  const [isViewImageDialogOpen, setIsViewImageDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsGenerating(true);
    try {
      const { surname, givenNames, deathDate } = form.getValues();

      if (!surname || !givenNames || !deathDate) {
        toast({
          title: 'Missing Information',
          description:
            'Please fill in all fields before generating a file number.',
          variant: 'destructive'
        });
        return;
      }

      const existingObituary = await obituaryExistsCheck(
        surname,
        givenNames,
        deathDate
      );

      setObituaryExists(existingObituary.length > 0);

      let newFileNumber: string;
      if (existingObituary.length > 0) {
        newFileNumber = await generateNewFileNumber(
          surname,
          givenNames,
          deathDate
        );
        // Fetch related images
        const images = await fetchImagesForObituaryAction(
          existingObituary[0]?.reference
        );
        setRelatedImages(images);
      } else {
        newFileNumber = await generateReference(surname);
        setRelatedImages([]);
      }
      setFileNumber(newFileNumber);
    } catch (error) {
      console.error('Error generating file number:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate file number. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!isViewImageDialogOpen) {
      onClose();
    }
  };

  const handleViewImage = (image: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedImage({ name: image } as BucketItem);
    setIsViewImageDialogOpen(true);
  };

  const handleCloseViewImageDialog = () => {
    setSelectedImage(null);
    setIsViewImageDialogOpen(false);
  };

  const handleRotate = async (fileName: string, degrees: number) => {
    // Implement rotation logic if needed
    console.log(`Rotating ${fileName} by ${degrees} degrees`);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isViewImageDialogOpen) return; // Prevent submission when ViewImageDialog is open

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
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
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
                    <Input className='uppercase' {...field} />
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
                    <Input className='capitalize' {...field} />
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
              <Button
                type="button"
                onClick={handleGenerateFileNumber}
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
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
                    <ul className="space-y-2 mt-2">
                      {relatedImages.map((image, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{image}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleViewImage(image, e)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Image
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No images related to this obituary.</p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={isLoading || !fileNumber || isViewImageDialogOpen}
              >
                {isLoading ? 'Creating...' : 'Create File Number'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      {selectedImage && isViewImageDialogOpen && (
        <ViewImageDialog
          image={selectedImage}
          onClose={handleCloseViewImageDialog}
          onRotate={handleRotate}
          getImageUrl={getImageUrlAction}
        />
      )}
    </Dialog>
  );
}
