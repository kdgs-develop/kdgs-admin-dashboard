import { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Obituary as ObituaryType } from '@/lib/db';
import { EditObituaryDialog } from './edit-obituary-dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { getEditObituaryDialogData, updateObituaryAction, deleteObituary } from './actions';
import { useRouter } from 'next/navigation';

export function Obituary({ obituary, onUpdate }: { obituary: NonNullable<ObituaryType>; onUpdate: () => void }) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<Awaited<ReturnType<typeof getEditObituaryDialogData>> | null>(null);

  const handleViewClick = () => {
    router.push(`/obituary/${obituary.reference}`);
  };

  const handleEditClick = async () => {
    if (!dialogData) {
      const data = await getEditObituaryDialogData();
      setDialogData(data);
    }
    setIsEditDialogOpen(true);
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
          <div className="flex space-x-2">
            <Button onClick={handleViewClick} variant="ghost" size="sm">
              View
            </Button>
            <Button onClick={handleEditClick} variant="ghost" size="sm">
              Edit
            </Button>
            <Button onClick={handleDeleteClick} variant="ghost" size="sm">
              Delete
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {dialogData && (
        <EditObituaryDialog
          obituary={obituary}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={async (updatedObituary) => {
            if (updatedObituary && 'id' in updatedObituary) {
              await updateObituaryAction(updatedObituary);
              onUpdate();
            } else {
              console.error('Invalid obituary data');
            }
            setIsEditDialogOpen(false);
          }}
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