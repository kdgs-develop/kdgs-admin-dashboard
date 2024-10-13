import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { BucketItem } from 'minio';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ViewImageDialogProps {
  image: BucketItem | null;
  onClose: (fileName: string) => void;
  onRotate?: (fileName: string, degrees: number) => Promise<void>;
  getImageUrl: (fileName: string) => Promise<string>;
}

export function ViewImageDialog({
  image,
  onClose,
  onRotate,
  getImageUrl
}: ViewImageDialogProps) {
  const [rotation, setRotation] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchImageUrl() {
      if (image && image.name) {
        setIsLoading(true);
        const url = await getImageUrl(image.name);
        setTimeout(() => {
          setImageUrl(url);
          setIsLoading(false);
        }, 500); // Minimum loading time of 500ms
      }
    }
    fetchImageUrl();
  }, [image, getImageUrl]);

  const handleRotate = async () => {
    if (image && image.name) {
      const newRotation = (rotation + 90) % 360;
      setRotation(newRotation);
      if (onRotate) await onRotate(image.name, newRotation);
      const newUrl = await getImageUrl(image.name);
      setImageUrl(newUrl);
    }
  };
  return (
    <Dialog open={!!image} onOpenChange={() => onClose(image?.name || '')}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{image?.name}</DialogTitle>
        </DialogHeader>
        <div
          className="flex-grow relative flex items-center justify-center"
          style={{ height: 'calc(90vh - 200px)' }}
        >
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
                style={{
                  objectFit: 'contain',
                  transform: `rotate(${rotation}deg)`
                }}
                className="transition-transform duration-300"
              />
            )
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleRotate}>Rotate</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}