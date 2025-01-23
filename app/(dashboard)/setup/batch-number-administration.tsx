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
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Edit, Loader2, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { addBatchNumber } from '../actions';
import { AddBatchNumberDialog } from '../add-batch-number-dialog';
import { deleteBatchNumber, getBatchNumbers, searchBatchNumbers, updateBatchNumber } from './actions';
import EditBatchNumberDialog from './edit-batch-number-dialog';

interface BatchNumberData {
  batchNumbers: { id: string; number: string; createdBy: { fullName: string | null }, createdAt: Date; _count?: { obituaries: number }; assignedObituaries: number }[];
  totalCount: number;
  totalPages: number;
}

export function BatchNumberAdministration() {
  const [batchData, setBatchData] = useState<BatchNumberData>({
    batchNumbers: [],
    totalCount: 0,
    totalPages: 0
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchNumber, setSearchNumber] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBatchNumber, setSelectedBatchNumber] = useState<{ id: string; number: string, assignedObituaries: number } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isLoading, setIsLoading] = useState(false);

  const fetchBatchNumbers = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getBatchNumbers(page, itemsPerPage);
      setBatchData(data);
    } catch (error) {
      toast({
        title: 'Error fetching batch numbers',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchBatchNumbers(currentPage);
    }
  }, [currentPage, isExpanded]);

  const handleSearch = async () => {
    if (!searchNumber) {
      await fetchBatchNumbers(1);
      setCurrentPage(1);
      return;
    }

    try {
      const results = await searchBatchNumbers(searchNumber, 1, itemsPerPage);
      setBatchData(results);
      setCurrentPage(1);
      
      if (results.totalCount === 0) {
        toast({
          title: 'No results found',
          description: `No batch numbers found matching "${searchNumber}"`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error searching batch numbers',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAddBatchNumber = async (number: string) => {
    try {
      const newBatchNumber = await addBatchNumber(number);
      toast({
        title: 'Success',
        description: 'Batch number added successfully',
      });
      await fetchBatchNumbers(1);
      setCurrentPage(1);
    } catch (error) {
      toast({
        title: 'Error adding batch number',
        description: error instanceof Error ? error.message : 'Failed to add batch number',
        variant: 'destructive'
      });
    }
  };

  const handleEditBatchNumber = async (number: string, assignedObituaries: number) => {
    if (!selectedBatchNumber) return;
    
    try {
      await updateBatchNumber(selectedBatchNumber.id, number, assignedObituaries);
      toast({
        title: 'Success',
        description: 'Batch number updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedBatchNumber(null);
      fetchBatchNumbers(currentPage);
    } catch (error) {
      toast({
        title: 'Error updating batch number',
        description: error instanceof Error ? error.message : 'Failed to update batch number',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteBatchNumber = async (id: string) => {
    if (!selectedBatchNumber) return;
    
    try {
      await deleteBatchNumber(id);
      toast({
        title: 'Success',
        description: 'Batch number deleted successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedBatchNumber(null);
      fetchBatchNumbers(currentPage);
    } catch (error) {
      toast({
        title: 'Error deleting batch number',
        description: error instanceof Error ? error.message : 'Failed to delete batch number',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <CardTitle>Batch Number Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage batch numbers
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
                placeholder="Search by number"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              variant="secondary"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>

          {batchData.batchNumbers.length > 0 && (
            <>
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Found Batch Numbers:</h3>
                <div className="space-y-2">
                  {batchData.batchNumbers.map((batch) => (
                    <div 
                      key={batch.id} 
                      className="p-3 border rounded flex justify-between items-center hover:bg-accent"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                        {batch.number} ({batch._count?.obituaries || 0} of {batch.assignedObituaries} assigned obituaries)
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Created by {batch.createdBy.fullName || 'Unknown'} on {batch.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBatchNumber(batch);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="py-2 px-3 text-sm">
                  Page {currentPage} of {batchData.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, batchData.totalPages))}
                  disabled={currentPage === batchData.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <AddBatchNumberDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAdd={handleAddBatchNumber}
            initialNumber={searchNumber}
          />

          <EditBatchNumberDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedBatchNumber(null);
            }}
            onEditBatchNumber={handleEditBatchNumber}
            onDeleteBatchNumber={handleDeleteBatchNumber}
            batchNumber={selectedBatchNumber}
          />
        </CardContent>
      )}
    </Card>
  );
} 