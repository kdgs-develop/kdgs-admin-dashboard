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
import { Plus, Search, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { getPeriodicals, addPeriodical, searchPeriodicals, updatePeriodical, deletePeriodical } from './actions';
import AddPeriodicalDialog from './add-periodical-dialog';
import { Input } from '@/components/ui/input';
import EditPeriodicalDialog from './edit-periodical-dialog';

export function PeriodicalAdministration() {
  const [periodicals, setPeriodicals] = useState<{ id: number; name: string }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPeriodical, setSelectedPeriodical] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchPeriodicals() {
      try {
        const fetchedPeriodicals = await getPeriodicals();
        setPeriodicals(fetchedPeriodicals);
      } catch (error) {
        toast({
          title: 'Error fetching periodicals',
          description: error instanceof Error ? error.message : 'An unknown error occurred',
          variant: 'destructive'
        });
      }
    }
    fetchPeriodicals();
  }, [toast]);

  const handleSearch = async () => {
    if (!searchName) {
      toast({
        title: 'Search Error',
        description: 'Please enter a name to search',
        variant: 'destructive'
      });
      return;
    }

    try {
      const results = await searchPeriodicals(searchName);
      setPeriodicals(results);
    } catch (error) {
      toast({
        title: 'Error searching periodicals',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleAddPeriodical = async (name: string) => {
    try {
      const newPeriodical = await addPeriodical(name);
      setPeriodicals(prev => [...prev, newPeriodical]);
      toast({
        title: 'Success',
        description: 'Periodical added successfully',
      });
    } catch (error) {
      toast({
        title: 'Error adding periodical',
        description: error instanceof Error ? error.message : 'Failed to add periodical',
        variant: 'destructive'
      });
    }
  };

  const handleEditPeriodical = async (name: string) => {
    if (!selectedPeriodical) return;
    
    try {
      const updatedPeriodical = await updatePeriodical(selectedPeriodical.id, name);
      setPeriodicals(prev => prev.map(periodical => 
        periodical.id === selectedPeriodical.id ? updatedPeriodical : periodical
      ));
      toast({
        title: 'Success',
        description: 'Periodical updated successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedPeriodical(null);
    } catch (error) {
      toast({
        title: 'Error updating periodical',
        description: error instanceof Error ? error.message : 'Failed to update periodical',
        variant: 'destructive'
      });
    }
  };

  const handleDeletePeriodical = async (id: number) => {
    if (!selectedPeriodical) return;
    
    try {
      await deletePeriodical(id);
      setPeriodicals(prev => prev.filter(periodical => periodical.id !== id));
      toast({
        title: 'Success',
        description: 'Periodical deleted successfully',
      });
      setIsEditDialogOpen(false);
      setSelectedPeriodical(null);
    } catch (error) {
      toast({
        title: 'Error deleting periodical',
        description: error instanceof Error ? error.message : 'Failed to delete periodical',
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
          <CardTitle>Periodical Management</CardTitle>
          {!isExpanded && (
            <CardDescription>
              Click to manage periodicals and search records
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
                placeholder="Search by name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
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

          {periodicals.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Found Periodicals:</h3>
              <div className="grid grid-cols-3 gap-2">
                {periodicals.map((periodical) => (
                  <div key={periodical.id} className="p-2 border rounded flex justify-between items-center">
                    <span>{periodical.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPeriodical(periodical);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AddPeriodicalDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onAddPeriodical={handleAddPeriodical}
            initialName={searchName}
          />

          <EditPeriodicalDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedPeriodical(null);
            }}
            onEditPeriodical={handleEditPeriodical}
            onDeletePeriodical={handleDeletePeriodical}
            periodical={selectedPeriodical}
          />
        </CardContent>
      )}
    </Card>
  );
} 