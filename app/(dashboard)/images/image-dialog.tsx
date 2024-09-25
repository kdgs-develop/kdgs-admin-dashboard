import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { BucketItem } from 'minio';

interface ImageDialogProps {
  image: BucketItem | null;
  onClose: () => void;
  onDelete: (fileName: string) => void;
  onRotate: (fileName: string, degrees: number) => void;
  getImageUrl: (fileName: string) => Promise<string>;
}

export function ImageDialog({ image, onClose, onDelete, onRotate, getImageUrl }: ImageDialogProps) {
  const [rotation, setRotation] = useState(0);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    async function fetchImageUrl() {
      if (image && image.name) {
        const url = await getImageUrl(image.name);
        setImageUrl(url);
      }
    }
    fetchImageUrl();
  }, [image, getImageUrl]);

  const handleRotate = () => {
    if (image && image.name) {
      const newRotation = (rotation + 90) % 360;
      setRotation(newRotation);
      onRotate(image.name, newRotation);
    }
  };

  const handleDelete = async () => {
    if (image && image.name) {
      await onDelete(image.name);
      onClose();
    }
  };

  return (
    <Dialog open={!!image} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{image?.name}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-64">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={image?.name || 'Image'}
              layout="fill"
              objectFit="contain"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
        </div>
        <div className="flex justify-between mt-4">
          <Button onClick={handleRotate}>Rotate</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}