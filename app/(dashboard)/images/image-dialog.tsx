import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { BucketItem } from 'minio';
import { DeleteImageConfirmationDialog } from './delete-image-confirmation-dialog';

interface ImageDialogProps {
  image: BucketItem | null;
  onClose: () => void;
  onDelete: (fileName: string) => void;
  onRotate: (fileName: string, degrees: number) => Promise<void>;
  getImageUrl: (fileName: string) => Promise<string>;
}

export function ImageDialog({ image, onClose, onDelete, onRotate, getImageUrl }: ImageDialogProps) {
  const [rotation, setRotation] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchImageUrl() {
      if (image && image.name) {
        const url = await getImageUrl(image.name);
        setImageUrl(url);
      }
    }
    fetchImageUrl();
  }, [image, getImageUrl]);

  const handleRotate = async () => {
    if (image && image.name) {
      const newRotation = (rotation + 90) % 360;
      setRotation(newRotation);
      await onRotate(image.name, newRotation);
      const newUrl = await getImageUrl(image.name);
      setImageUrl(newUrl);
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (image && image.name) {
      onDelete(image.name);
      setIsDeleteDialogOpen(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={!!image} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{image?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow relative" style={{ height: 'calc(90vh - 200px)' }}>
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={image?.name || 'Image'}
                fill
                style={{ objectFit: 'contain', transform: `rotate(${rotation}deg)` }}
                className="transition-transform duration-300"
              />
            )}
          </div>
          <div className="flex justify-between mt-4">
            <Button onClick={handleRotate}>Rotate</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
      <DeleteImageConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        imageName={image?.name || ''}
      />
    </>
  );
}