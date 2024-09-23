import { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
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
import { Obituary as ObituaryType } from '@/lib/db';
import { EditObituaryDialog } from './edit-obituary-dialog';
import { DeleteConfirmationDialog } from './delete-confimation-dialog';
import { getEditObituaryDialogData, updateObituaryAction, deleteObituary } from './actions';

export function Obituary({ obituary, onUpdate }: { obituary: NonNullable<ObituaryType>; onUpdate: () => void }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<Awaited<ReturnType<typeof getEditObituaryDialogData>> | null>(null);

  const handleEditClick = async () => {
    if (!dialogData) {
      const data = await getEditObituaryDialogData();
      setDialogData(data);
    }
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
  };

  const handleSave = async (updatedObituary: ObituaryType | Omit<ObituaryType, "id"> | null) => {
    if (updatedObituary && 'id' in updatedObituary) {
      await updateObituaryAction(updatedObituary);
      onUpdate();
    } else {
      console.error('Invalid obituary data');
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const formData = new FormData();
    formData.append('id', obituary.id.toString());
    await deleteObituary(formData);
    onUpdate();
    setIsDeleteDialogOpen(false);
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
              <DropdownMenuItem onSelect={handleDeleteClick}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {dialogData && (
        <EditObituaryDialog
          obituary={obituary}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
          onSave={handleSave}
          {...dialogData}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}