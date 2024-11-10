import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Obituary as ObituaryType } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteObituary, getEditObituaryDialogData } from './actions';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { EditObituaryDialog } from './edit-obituary-dialog';

export function Obituary({
  obituary,
  onUpdate,
  role
}: {
  obituary: NonNullable<ObituaryType>;
  onUpdate: () => void;
  role: string | null;
}) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<Awaited<
    ReturnType<typeof getEditObituaryDialogData>
  > | null>(null);

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
        <TableCell>
          {obituary.deathDate ? obituary.deathDate.toISOString().split('T')[0] : 'N/A'}
        </TableCell>
        <TableCell>
          <Badge variant={obituary.proofread ? 'outline' : 'destructive'}>
            {obituary.proofread ? 'Proofread' : 'Not Proofread'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button onClick={handleViewClick} variant="outline" size="sm">
              View Report
            </Button>
            {(role === 'ADMIN' || role === 'PROOFREADER' || role === 'INDEXER') && (
            <Button
              onClick={handleEditClick}
              variant="default"
              size="sm"
              disabled={role !== 'ADMIN' && role !== 'PROOFREADER' && role !== 'INDEXER'}
            >
              Edit
            </Button>
            )}
            {role === 'ADMIN' && (
              <Button
                onClick={handleDeleteClick}
                variant="destructive"
                size="sm"
                disabled={role !== 'ADMIN'}
              >
                Delete
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      {dialogData && (
        <EditObituaryDialog
          obituary={obituary}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={async (updatedObituary) => {
            onUpdate();
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
