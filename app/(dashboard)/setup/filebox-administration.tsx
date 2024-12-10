'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { getFileBoxes, addFileBox, searchFileBoxes } from './actions';
import AddFileBoxDialog from './add-filebox-dialog';
import { Input } from '@/components/ui/input';

export function FileBoxAdministration() {
  const [fileBoxes, setFileBoxes] = useState<{ id: number; year: number; number: number }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchYear, setSearchYear] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    async function fetchFileBoxes() {
      try {
        const fetchedFileBoxes = await getFileBoxes();
        setFileBoxes(fetchedFileBoxes);
      } catch (error) {
        toast({
          title: 'Error fetching file boxes',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive'
        });
      }
    }
    fetchFileBoxes();
  }, [toast]);

  const handleSearch = async () => {
    if (!searchYear && !searchNumber) {
      toast({
        title: 'Search Error',
        description: 'Please enter a year or number to search',
        variant: 'destructive'
      });
      return;
    }

    try {
      const results = await searchFileBoxes(
        searchYear ? parseInt(searchYear) : undefined,
        searchNumber ? parseInt(searchNumber) : undefined
      );
      setFileBoxes(results);
    } catch (error) {
      toast({
        title: 'Error searching file boxes',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAddFileBox = async (year: number, number: number) => {
    try {
      const newFileBox = await addFileBox(year, number);
      setFileBoxes(prev => [...prev, newFileBox]);
      toast({
        title: 'Success',
        description: 'File box added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error adding file box',
        description: error instanceof Error ? error.message : 'Failed to add file box',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Box Management</CardTitle>
        <CardDescription>
          Search for existing file boxes or add a new one. Each file box is identified by a year and number combination.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search by year"
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              type="number"
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Search by number"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              type="number"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>

        {fileBoxes.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Found File Boxes:</h3>
            <div className="grid grid-cols-3 gap-2">
              {fileBoxes.map((box) => (
                <div key={box.id} className="p-2 border rounded">
                  Year: {box.year}, Number: {box.number}
                </div>
              ))}
            </div>
          </div>
        )}

        <AddFileBoxDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onAddFileBox={handleAddFileBox}
        />
      </CardContent>
    </Card>
  );
}
