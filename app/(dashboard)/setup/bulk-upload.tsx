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
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = () => {
    if (!files || files.length === 0) {
      toast({
        title: 'No Files Selected',
        description: 'Please select files to upload.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    processNextFile(Array.from(files), 0);
  };

  const processNextFile = async (remainingFiles: File[], index: number) => {
    if (index >= remainingFiles.length) {
      setIsUploading(false);
      setUploadProgress(100);
      toast({
        title: 'Upload Complete',
        description: 'All files have been uploaded successfully.'
      });
      return;
    }

    const file = remainingFiles[index];
    setCurrentFile(file);

    try {
      await uploadFile(file);
      const progress = ((index + 1) / remainingFiles.length) * 100;
      setUploadProgress(progress);
      processNextFile(remainingFiles, index + 1);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
      processNextFile(remainingFiles, index + 1);
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

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
      return new Promise<void>((resolve, reject) => {
        setOverwriteDialogOpen(true);
        const handleConfirm = async () => {
          setOverwriteDialogOpen(false);
          try {
            await performUpload(formData);
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        const handleCancel = () => {
          setOverwriteDialogOpen(false);
          resolve();
        };
        setOverwriteHandlers({ handleConfirm, handleCancel });
      });
    } else {
      return performUpload(formData);
    }
  };

  const performUpload = async (formData: FormData) => {
    const uploadResponse = await fetch('/api/bulk-upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();
    console.log('Upload result:', result);
  };

  const [overwriteHandlers, setOverwriteHandlers] = useState<{
    handleConfirm: () => void;
    handleCancel: () => void;
  }>({ handleConfirm: () => {}, handleCancel: () => {} });

  return (
    <Card className="w-[calc(100%)]">
      <CardHeader>
        <CardTitle>Bulk Upload</CardTitle>
        <CardDescription>Upload multiple image files at once.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div className="space-y-4">
          <Input type="file" multiple onChange={handleFileChange} className='hover:cursor-pointer' />
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
        onConfirm={overwriteHandlers.handleConfirm}
        onCancel={overwriteHandlers.handleCancel}
        fileName={currentFile?.name || ''}
      />
    </Card>
  );
}
