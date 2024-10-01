import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { getUserRole, Obituary as ObituaryType } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  deleteObituary,
  getEditObituaryDialogData,
  updateObituaryAction
} from './actions';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { EditObituaryDialog } from './edit-obituary-dialog';
import { useAuth } from '@clerk/nextjs';

export function Obituary({
  obituary,
  onUpdate
}: {
  obituary: NonNullable<ObituaryType>;
  onUpdate: () => void;
}) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<Awaited<
    ReturnType<typeof getEditObituaryDialogData>
  > | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const { userId } = useAuth();
  useEffect(() => {
    async function fetchRole() {
      const fetchedRole = await getUserRole(userId ?? '');
      setRole(fetchedRole ?? '');
    }
    fetchRole();
  }, []);

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
          {obituary.deathDate?.toLocaleDateString() ?? 'N/A'}
        </TableCell>
        <TableCell>
          <Badge variant={obituary.proofread ? 'default' : 'secondary'}>
            {obituary.proofread ? 'Proofread' : 'Not Proofread'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button onClick={handleViewClick} variant="ghost" size="sm">
              View
            </Button>
            <Button onClick={handleEditClick} variant="ghost" size="sm" disabled={role !== 'ADMIN'}>
              Edit
            </Button>
            <Button onClick={handleDeleteClick} variant="ghost" size="sm" disabled={role !== 'ADMIN'}>
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
            await updateObituaryAction({ ...updatedObituary, id: obituary.id });
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
