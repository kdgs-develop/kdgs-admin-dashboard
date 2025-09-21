import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { getImageRotation, ImageWithObituary as ImageType } from "@/lib/db";
import Image from "next/image";
import { BucketItem } from "minio";

interface ViewImageDialogProps {
  image: ImageType | BucketItem | null;
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
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    async function fetchImageUrl() {
      if (image?.name) {
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
      getImageRotation(image.name).then(rotation => {
        setRotation(rotation || 0);
      });
    }
  }, [image]);

  const handleZoomIn = () => setScale(s => s + 0.5);
  const handleZoomOut = () => {
    setScale(s => {
      const newScale = s > 1 ? s - 0.5 : 1;
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleRotate = async () => {
    if (image && image.name) {
      await onRotate(image.name);
      const newRotation = await getImageRotation(image.name);
      setRotation(newRotation || 0);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastPosition.current.x;
      const deltaY = e.clientY - lastPosition.current.y;

      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      lastPosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={!!image} onOpenChange={() => onClose(image?.name || "")}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{image?.name}</DialogTitle>
          <DialogDescription>View the image.</DialogDescription>
        </DialogHeader>

        <div
          className="flex-grow relative"
          style={{
            height: "calc(90vh - 200px)",
            cursor: isDragging ? "grabbing" : "grab",
            overflow: "hidden"
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-t-4 border-gray-200 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: "center",
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Image
                  src={imageUrl}
                  alt={image?.name || "Image"}
                  fill
                  style={{
                    objectFit: "contain",
                    pointerEvents: "none"
                  }}
                  draggable={false}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <div className="flex gap-2">
            <Button onClick={handleZoomIn} variant="secondary">
              Zoom In
            </Button>
            <Button onClick={handleZoomOut} variant="secondary">
              Zoom Out
            </Button>
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
                    const link = document.createElement("a");
                    link.href = url;
                    const fileName = image.name;
                    console.log("Downloading file:", fileName);
                    link.download = fileName;
                    // Hide link
                    link.style.display = "none";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error("Download error:", error);
                  }
                }
              }}
            >
              Download
            </Button>
          </div>
          <Button
            variant="destructive"
            onClick={() => onClose(image?.name || "")}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
