'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import path from 'path';
import { useState, useEffect } from 'react';
import { OverwriteConfirmationDialog } from './overwrite-confirmation-dialog';

export function BulkUpload() {
  const [showInstructions, setShowInstructions] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [remainingFiles, setRemainingFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isUploading && remainingFiles.length > 0) {
      uploadNextFile();
    } else if (isUploading && remainingFiles.length === 0) {
      setIsUploading(false);
      setUploadProgress(100);
      toast({
        title: 'Upload Complete',
        description: 'All files have been uploaded successfully.'
      });
    }
  }, [isUploading, remainingFiles]);

  const handleToggleInstructions = () => {
    setShowInstructions(!showInstructions);
    if (!showInstructions) {
      toast({
        title: 'Instructions Displayed',
        description: 'Bulk upload instructions are now visible.'
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = () => {
    if (!files || files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to upload.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setRemainingFiles(Array.from(files));
  };

  const uploadNextFile = async () => {
    if (remainingFiles.length === 0) {
      return;
    }

    const file = remainingFiles[0];
    setCurrentFile(file);

    try {
      await uploadFile(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading the file.',
        variant: 'destructive'
      });
    }
    setRemainingFiles(prevFiles => prevFiles.slice(1));
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const filenameWithoutExt = path.parse(file.name).name;
      const checkResponse = await fetch(
        `/api/check-file-exists?filename=${encodeURIComponent(filenameWithoutExt)}`,
        { method: 'GET' }
      );

      if (!checkResponse.ok) {
        throw new Error('Failed to check file existence');
      }

      const { exists } = await checkResponse.json();

      if (exists) {
        setOverwriteDialogOpen(true);
        return;
      }

      const uploadResponse = await fetch('/api/bulk-upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const result = await uploadResponse.json();
      console.log('Upload result:', result);

      const progress = ((files!.length - remainingFiles.length + 1) / files!.length) * 100;
      setUploadProgress(progress);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleOverwriteConfirm = () => {
    setOverwriteDialogOpen(false);
    if (currentFile) {
      uploadFile(currentFile).then(() => {
        setRemainingFiles(prevFiles => prevFiles.slice(1));
      });
    }
  };

  const handleOverwriteCancel = () => {
    setOverwriteDialogOpen(false);
    setRemainingFiles(prevFiles => prevFiles.slice(1));
  };

  return (
    <Card className="w-[calc(100%)]">
      <CardHeader>
        <CardTitle>Bulk Upload</CardTitle>
        <CardDescription>Upload multiple image files at once.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div className="space-y-4">
          <Input type="file" multiple onChange={handleFileChange} />
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
          {isUploading && (
            <Progress value={uploadProgress} className="w-full" />
          )}
        </div>
      </CardContent>
      <OverwriteConfirmationDialog
        isOpen={overwriteDialogOpen}
        onConfirm={handleOverwriteConfirm}
        onCancel={handleOverwriteCancel}
        fileName={currentFile?.name || ''}
      />
    </Card>
  );
}
