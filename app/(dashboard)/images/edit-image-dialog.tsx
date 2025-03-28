import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { BucketItem } from 'minio';
import { DeleteImageConfirmationDialog } from './delete-image-confirmation-dialog';
import { rotateImageAction } from './minio-actions';
import { getImageRotation, ImageWithObituary as ImageType } from '@/lib/db';

interface EditImageDialogProps {
  image: ImageType | BucketItem | null;
  onClose: () => void;
  onDelete: (fileName: string) => void;
  onRotate: (fileName: string) => Promise<void>;
  getImageUrl: (fileName: string) => Promise<string>;
}

export function EditImageDialog({ image, onClose, onDelete, onRotate, getImageUrl }: EditImageDialogProps) {
  const [rotation, setRotation] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchImageUrl() {
      if (image && image.name) {
        setIsLoading(true);
        const url = await getImageUrl(image.name);
        setImageUrl(url);
        setIsLoading(false);
      }
    }
    fetchImageUrl();
  }, [image, getImageUrl]);

  useEffect(() => {
    async function fetchRotation() {
      if (image && image.name) {
        const currentRotation = await getImageRotation(image.name);
        setRotation(currentRotation || 0); // Set the rotation state
      }
    }
    fetchRotation();
  }, [image]);

  const handleRotate = async () => {
    if (image && image.name) {
      await onRotate(image.name);
      const newRotation = await getImageRotation(image.name);
      setRotation(newRotation || 0); // Update the local state with the new rotation
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
            <DialogTitle>Edit Image: {image?.name}</DialogTitle>
            <DialogDescription>
              Edit the image and save the changes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow relative flex items-center justify-center" style={{ height: 'calc(90vh - 200px)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-4 border-gray-200 rounded-full animate-spin"></div>
              </div>
            ) : (
              imageUrl && (
                <Image
                  src={imageUrl}
                  alt={image?.name || 'Image'}
                  fill
                  style={{ objectFit: 'contain', transform: `rotate(${rotation}deg)` }}
                  className="transition-transform duration-300"
                />
              )
            )}
          </div>
          <div className="flex justify-between mt-4">
            <div className="flex gap-2">
              <Button onClick={handleRotate}>Rotate</Button>
              <Button 
                onClick={async () => {
                  if (image?.name && imageUrl) {
                    try {
                      const response = await fetch(imageUrl);
                      const blob = await response.blob();
                      // Create a new blob with the correct filename
                      const newBlob = new Blob([blob], { type: blob.type });
                      const url = window.URL.createObjectURL(newBlob);
                      const link = document.createElement('a');
                      link.href = url;
                      const fileName = image.name;
                      console.log('Downloading file:', fileName);
                      link.download = fileName;
                      // Hide link
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error('Download error:', error);
                    }
                  }
                }}
              >
                Download
              </Button>
            </div>
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