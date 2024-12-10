'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { addFileBox, getFileBoxes } from './actions';
import AddFileBoxDialog from './add-filebox-dialog';

export function FileBoxAdministration() {
  const [fileBoxes, setFileBoxes] = useState<
    { id: number; year: number; number: number }[]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchFileBoxes() {
      try {
        const fetchedFileBoxes = await getFileBoxes();
        setFileBoxes(fetchedFileBoxes);
      } catch (error) {
        toast({
          title: 'Error fetching file boxes',
          description:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          variant: 'destructive'
        });
      }
    }
    fetchFileBoxes();
  }, [toast]);

  const handleAddFileBox = async (year: number, number: number) => {
    try {
      const newFileBox = await addFileBox(year, number);
      setFileBoxes((prev) => [...prev, newFileBox]);
      toast({
        title: 'Success',
        description: 'File box added successfully'
      });
    } catch (error) {
      toast({
        title: 'Error adding file box',
        description:
          error instanceof Error ? error.message : 'Failed to add file box',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New File Box</CardTitle>
        <CardDescription>
          Add a new file box to the database. If the file box already exists, an
          error message will be shown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-start">
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add New File Box
          </Button>
        </div>
        <AddFileBoxDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAddFileBox={handleAddFileBox}
        />
      </CardContent>
    </Card>
  );
}
