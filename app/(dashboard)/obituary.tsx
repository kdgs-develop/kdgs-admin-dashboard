import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Obituary as ObituaryType } from '@/lib/db';
import { deleteObituaryById } from '@/lib/db';
import { EditObituaryDialog } from './edit-obituary-dialog';

export function Obituary({ obituary }: { obituary: NonNullable<ObituaryType> }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
  };

  const handleSave = (updatedObituary: ObituaryType) => {
    // Handle the updated obituary data here
    // You might want to update the local state or trigger a refetch of the data
    console.log('Obituary updated:', updatedObituary);
  };

  return (
    <>
      <TableRow>
        <TableCell>{obituary.reference}</TableCell>
        <TableCell>{obituary.surname ?? 'N/A'}</TableCell>
        <TableCell>{obituary.givenNames ?? 'N/A'}</TableCell>
        <TableCell>{obituary.deathDate?.toLocaleDateString() ?? 'N/A'}</TableCell>
        <TableCell>
          <Badge variant={obituary.proofread ? "default" : "secondary"}>
            {obituary.proofread ? "Proofread" : "Not Proofread"}
          </Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onSelect={handleEditClick}>Edit</DropdownMenuItem>
              <DropdownMenuItem>
                <form action={deleteObituaryById.bind(null, obituary.id)}>
                  <button type="submit">Delete</button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <EditObituaryDialog
        obituary={obituary}
        isOpen={isEditDialogOpen}
        onClose={handleDialogClose}
        onSave={handleSave}
      />
    </>
  );
}