import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TableCell, TableRow } from '@/components/ui/table';
import { Obituary as ObituaryType } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { deleteObituary, getEditObituaryDialogData } from './actions';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { EditObituaryDialog } from './edit-obituary-dialog';
import { fetchImagesForObituaryAction } from './obituary/[reference]/actions';

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
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    async function fetchImages() {
      if (obituary.reference) {
        setIsLoading(true);
        setLoadingProgress(0);

        // Start progress simulation
        const progressInterval = setInterval(() => {
          setLoadingProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        try {
          const imageFiles = await fetchImagesForObituaryAction(
            obituary.reference
          );
          clearInterval(progressInterval);
          setLoadingProgress(100);
          setImages(imageFiles);

          // Small delay before hiding the progress bar
          setTimeout(() => {
            setIsLoading(false);
            setLoadingProgress(0);
          }, 200);
        } catch (error) {
          clearInterval(progressInterval);
          setIsLoading(false);
          setLoadingProgress(0);
        }
      }
    }
    fetchImages();
  }, [obituary.reference]);

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
          {obituary.deathDate
            ? obituary.deathDate.toISOString().split('T')[0]
            : 'N/A'}
        </TableCell>
        <TableCell className="w-[200px]">
          <div className="w-full">
            {isLoading ? (
              <div className="py-2">
                <Progress value={loadingProgress} className="h-2 w-full" />
              </div>
            ) : images.length > 0 ? (
              images.length === 1 ? (
                <span className="truncate">{images[0]}</span>
              ) : (
                <ul className="list-none space-y-1">
                  {images.map((image, index) => (
                    <li key={index} className="truncate text-xs">
                      {image}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              'No images'
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={obituary.proofread ? 'outline' : 'destructive'}>
            {obituary.proofread ? 'Proofread' : 'Not Proofread'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button 
              onClick={handleViewClick} 
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200"
            >
              View Report
            </Button>
            {(role === 'ADMIN' ||
              role === 'PROOFREADER' ||
              role === 'INDEXER') && (
              <Button
                onClick={handleEditClick}
                size="sm"
                disabled={
                  role !== 'ADMIN' &&
                  role !== 'PROOFREADER' &&
                  role !== 'INDEXER'
                }
                className="bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200"
              >
                Edit
              </Button>
            )}
            {role === 'ADMIN' && (
              <Button
                onClick={handleDeleteClick}
                size="sm"
                disabled={role !== 'ADMIN'}
                className="bg-gray-400 hover:bg-gray-500 text-white transition-colors duration-200"
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
