'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, Edit, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  addFileBox,
  deleteFileBox,
  getFileBoxes,
  getObituaryCountForFileBox,
  getOpenFileBoxId,
  searchFileBoxes,
  setOpenFileBoxId,
  updateFileBox
} from './actions';
import AddFileBoxDialog from './add-filebox-dialog';
import EditFileBoxDialog from './edit-filebox-dialog';

export function FileBoxAdministration() {
  const [fileBoxes, setFileBoxes] = useState<
    { id: number; year: number; number: number; obituaryCount: number }[]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchYear, setSearchYear] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFileBox, setSelectedFileBox] = useState<{
    id: number;
    year: number;
    number: number;
  } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentOpenFileBoxId, setCurrentOpenFileBoxId] = useState<
    number | null
  >(null);

  useEffect(() => {
    async function fetchFileBoxes() {
      try {
        const fetchedFileBoxes = await getFileBoxes();
        const fileBoxesWithCounts = await Promise.all(
          fetchedFileBoxes.map(async (box) => {
            const count = await getObituaryCountForFileBox(box.id);
            return { ...box, obituaryCount: count };
          })
        );
        setFileBoxes(fileBoxesWithCounts);
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

    async function fetchCurrentOpenFileBox() {
      try {
        const openFileBoxId = await getOpenFileBoxId();
        setCurrentOpenFileBoxId(openFileBoxId);
      } catch (error) {
        toast({
          title: 'Error fetching current open file box',
          description:
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          variant: 'destructive'
        });
      }
    }

    fetchFileBoxes();
    fetchCurrentOpenFileBox();
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
      const resultsWithCounts = await Promise.all(
        results.map(async (box) => {
          const count = await getObituaryCountForFileBox(box.id);
          return { ...box, obituaryCount: count };
        })
      );
      setFileBoxes(resultsWithCounts);
    } catch (error) {
      toast({
        title: 'Error searching file boxes',
        description:
          error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAddFileBox = async (year: number, number: number) => {
    try {
      const newFileBox = await addFileBox(year, number);
      const count = await getObituaryCountForFileBox(newFileBox.id);
      setFileBoxes((prev) => [
        ...prev,
        { ...newFileBox, obituaryCount: count }
      ]);
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

  const handleEditFileBox = async (year: number, number: number) => {
    if (!selectedFileBox) return;

    try {
      const updatedFileBox = await updateFileBox(
        selectedFileBox.id,
        year,
        number
      );
      const count = await getObituaryCountForFileBox(updatedFileBox.id);
      setFileBoxes((prev) =>
        prev.map((box) =>
          box.id === selectedFileBox.id
            ? { ...updatedFileBox, obituaryCount: count }
            : box
        )
      );
      toast({
        title: 'Success',
        description: 'File box updated successfully'
      });
      setIsEditDialogOpen(false);
      setSelectedFileBox(null);
    } catch (error) {
      toast({
        title: 'Error updating file box',
        description:
          error instanceof Error ? error.message : 'Failed to update file box',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteFileBox = async (id: number) => {
    if (!selectedFileBox) return;

    try {
      await deleteFileBox(id);
      setFileBoxes((prev) => prev.filter((box) => box.id !== id));
      toast({
        title: 'Success',
        description: 'File box deleted successfully'
      });
      setIsEditDialogOpen(false);
      setSelectedFileBox(null);
    } catch (error) {
      toast({
        title: 'Error deleting file box',
        description:
          error instanceof Error ? error.message : 'Failed to delete file box',
        variant: 'destructive'
      });
    }
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const checkAndCreateNewFileBox = async (box: {
    id: number;
    year: number;
    number: number;
    obituaryCount: number;
  }) => {
    if (box.year === 0 && box.number === 0) {
      return;
    }

    if (box.obituaryCount >= 950) {
      const year = new Date().getFullYear();
      const existingBoxes = fileBoxes.filter((b) => b.year === year);
      const newNumber = existingBoxes.length > 0 ? existingBoxes.length + 1 : 1;
      await handleAddFileBox(year, newNumber);
    }
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <CardTitle>File Box Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage file boxes and search records
            </CardDescription>
          )}
        </div>
        <Button variant="ghost" size="icon">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      {isExpanded && (
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
            <Button onClick={handleOpenDialog} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {fileBoxes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Found File Boxes:</h3>
              <div className="grid grid-cols-3 gap-2">
                {fileBoxes.map((box) => {
                  checkAndCreateNewFileBox(box);
                  return (
                    <div
                      key={box.id}
                      className="p-2 border rounded flex justify-between flex-col"
                    >
                      <span>
                        Year: {box.year}, <br />
                        Number: {box.number}, <br />
                        Obituaries: {box.obituaryCount} <br />
                        {box.id === currentOpenFileBoxId ? (
                          <span className="text-green-500 font-semibold">Open</span>
                        ) : (
                          <span className="text-red-500 font-semibold">Closed</span>
                        )}
                      </span>
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFileBox(box);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {box.id !== currentOpenFileBoxId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await setOpenFileBoxId(box.id);
                                setCurrentOpenFileBoxId(box.id);
                                toast({
                                  title: 'Success',
                                  description: 'File box set as open'
                                });
                              } catch (error) {
                                toast({
                                  title: 'Error setting file box as open',
                                  description:
                                    error instanceof Error
                                      ? error.message
                                      : 'An unknown error occurred',
                                  variant: 'destructive'
                                });
                              }
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Set Open
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <AddFileBoxDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddFileBox={handleAddFileBox}
            initialYear={searchYear ? parseInt(searchYear) : undefined}
            initialNumber={searchNumber ? parseInt(searchNumber) : undefined}
          />

          <EditFileBoxDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedFileBox(null);
            }}
            onEditFileBox={handleEditFileBox}
            onDeleteFileBox={handleDeleteFileBox}
            fileBox={selectedFileBox}
          />
        </CardContent>
      )}
    </Card>
  );
}
