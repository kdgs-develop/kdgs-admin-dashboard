import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadImagesAction } from './minio-actions';

interface UploadImagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadImagesDialog({ isOpen, onClose }: UploadImagesDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files.slice(0, 25)); // Limit to 25 files
  };

  const handleUpload = async () => {
    if (selectedFiles.length > 0) {
      try {
        await uploadImagesAction(selectedFiles);
        onClose();
        // You might want to refresh the image list here
      } catch (error) {
        console.error('Error uploading files:', error);
        // Handle error (e.g., show an error message to the user)
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Images</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          <p className="text-sm text-muted-foreground">
            Selected files: {selectedFiles.length} (max 25)
          </p>
          <Button onClick={handleUpload} disabled={selectedFiles.length === 0}>
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}