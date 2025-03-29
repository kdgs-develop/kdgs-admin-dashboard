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
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 }); // Centered by default
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  // Add a calculated scaling factor for rotated images
  const getAutoScaleFactor = () => {
    // No additional scaling needed for normal orientation
    if (rotation % 180 === 0) return 1;

    // For 90° or 270° rotations, apply additional scaling to fit
    return 0.7; // Reducing to 70% helps fit rotated images
  };

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
      getImageRotation(image.name).then(rotation => {
        setRotation(rotation || 0);
      });
    }
  }, [image]);

  const handleZoom = () => {
    if (isZoomed) {
      setScale(1); // Reset scale to 1
      setPosition({ x: 50, y: 50 }); // Reset position to center
    } else {
      setScale(2); // Zoom in
    }
    setIsZoomed(!isZoomed);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isZoomed && imageContainerRef.current) {
      const { clientX, clientY } = e;
      const { left, top, width, height } =
        imageContainerRef.current.getBoundingClientRect();
      const x = ((clientX - left) / width) * 100;
      const y = ((clientY - top) / height) * 100;
      setPosition({ x, y });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isZoomed) {
      isDragging.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseMoveDrag = (e: MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMousePosition.current.x;
      const dy = e.clientY - lastMousePosition.current.y;
      setPosition(prev => ({
        x: prev.x + (dx / imageContainerRef.current!.clientWidth) * 100,
        y: prev.y + (dy / imageContainerRef.current!.clientHeight) * 100
      }));
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMoveDrag);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMoveDrag);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleRotate = async () => {
    if (image && image.name) {
      await onRotate(image.name);
      const newRotation = await getImageRotation(image.name);
      setRotation(newRotation || 0);

      // Always reset zoom and position when rotating
      setScale(1);
      setPosition({ x: 50, y: 50 });
      setIsZoomed(false);
    }
  };

  return (
    <Dialog open={!!image} onOpenChange={() => onClose(image?.name || "")}>
      <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{image?.name}</DialogTitle>
          <DialogDescription>View the image.</DialogDescription>
        </DialogHeader>

        <div
          ref={imageContainerRef}
          className={`flex-grow relative flex items-center justify-center ${isZoomed ? "overflow-auto" : "overflow-hidden"}`}
          style={{
            height: "calc(90vh - 200px)",
            cursor: isZoomed ? "grab" : "zoom-in",
            scrollBehavior: "smooth"
          }}
          onMouseMove={handleMouseMove}
          onClick={handleZoom}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-t-4 border-gray-200 rounded-full animate-spin"></div>
            </div>
          ) : (
            imageUrl && (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  minWidth: isZoomed ? "100%" : "auto",
                  minHeight: isZoomed ? "100%" : "auto"
                }}
              >
                <div
                  style={{
                    transform: `rotate(${rotation}deg) scale(${scale * getAutoScaleFactor()})`,
                    transformOrigin: "center",
                    maxWidth: Math.abs(rotation % 180) === 90 ? "70%" : "100%",
                    maxHeight: Math.abs(rotation % 180) === 90 ? "70%" : "100%",
                    transition: "transform 0.3s ease",
                    position: "relative",
                    width: "100%",
                    height: "100%"
                  }}
                >
                  <Image
                    src={imageUrl}
                    alt={image?.name || "Image"}
                    fill
                    style={{
                      objectFit: "contain"
                    }}
                  />
                </div>
              </div>
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
