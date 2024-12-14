import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { getImageRotation } from '@/lib/db';
import { BucketItem } from 'minio';
import Image from 'next/image';

interface ViewImageDialogProps {
  image: BucketItem | null;
  onClose: (fileName: string) => void;
  getImageUrl: (fileName: string) => Promise<string>;
  onRotate: (fileName: string) => Promise<void>;
}

export function ViewImageDialog({
  image,
  onClose,
  getImageUrl,
  onRotate
}: ViewImageDialogProps) {
  const [rotation, setRotation] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Centered by default
  const imageContainerRef = useRef<HTMLDivElement>(null);

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
    if (image && image.name) {
      getImageRotation(image.name).then((rotation) => {
        setRotation(rotation || 0);
      });
    }
  }, [image]);

  const handleZoom = () => {
    setScale(isZoomed ? 1 : 2); // Toggle zoom scale
    setIsZoomed(!isZoomed);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isZoomed && imageContainerRef.current) {
      const { clientX, clientY } = e;
      const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
      const x = ((clientX - left) / width) * 100;
      const y = ((clientY - top) / height) * 100;
      setPosition({ x, y });
    }
  };

  const handleRotate = async () => {
    if (image && image.name) {
      await onRotate(image.name);
      const newRotation = await getImageRotation(image.name);
      setRotation(newRotation || 0);
    }
  };

  return (
    <Dialog open={!!image} onOpenChange={() => onClose(image?.name || '')}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{image?.name}</DialogTitle>
          <DialogDescription>View the image.</DialogDescription>
        </DialogHeader>
        
        <div
          ref={imageContainerRef}
          className="flex-grow relative flex items-center justify-center cursor-zoom-in"
          style={{ height: 'calc(90vh - 200px)', cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
          onMouseMove={handleMouseMove}
          onClick={handleZoom}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-4 border-gray-200 rounded-full animate-spin"></div>
            </div>
          ) : (
            imageUrl && (
              <div
                style={{
                  transform: `rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: `${position.x}% ${position.y}%`,
                  transition: 'transform 0.3s ease',
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                }}
              >
                <Image
                  src={imageUrl}
                  alt={image?.name || 'Image'}
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </div>
            )
          )}
        </div>

        <div className="flex justify-between mt-4">
          <Button onClick={handleRotate}>Rotate</Button>
          <Button variant="destructive" onClick={() => onClose(image?.name || '')}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
