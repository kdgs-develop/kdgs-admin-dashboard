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
import { useCallback, useState } from 'react';
import { OverwriteConfirmationDialog } from './overwrite-confirmation-dialog';

export function BulkUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<
    { fileName: string; status: 'uploaded' | 'skipped' | 'overwritten' | 'failed' }[]
  >([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = useCallback(() => {
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
    setUploadResults([]);
    processNextFile(Array.from(files), 0);
  }, [files]);

  const uploadFile = useCallback(async (file: File): Promise<'uploaded' | 'skipped' | 'overwritten'> => {
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
      return new Promise((resolve) => {
        setOverwriteDialogOpen(true);
        const handleConfirm = async () => {
          setOverwriteDialogOpen(false);
          await performUpload(formData);
          resolve('overwritten');
        };
        const handleCancel = () => {
          setOverwriteDialogOpen(false);
          resolve('skipped');
        };
        setOverwriteHandlers({ handleConfirm, handleCancel });
      });
    } else {
      await performUpload(formData);
      return 'uploaded';
    }
  }, []);

  const processNextFile = useCallback(
    async (remainingFiles: File[], index: number) => {
      if (index >= remainingFiles.length) {
        setIsUploading(false);
        setUploadProgress(100);
        return;
      }

      const file = remainingFiles[index];
      setCurrentFile(file);

      try {
        const status = await uploadFile(file);
        setUploadResults((prev) => [
          ...prev,
          { fileName: file.name, status }
        ]);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadResults((prev) => [
          ...prev,
          { fileName: file.name, status: 'failed' }
        ]);
        toast({
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: 'destructive'
        });
      }

      const progress = ((index + 1) / remainingFiles.length) * 100;
      setUploadProgress(progress);
      processNextFile(remainingFiles, index + 1);
    },
    [uploadFile]
  );

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
          <Input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hover:cursor-pointer"
          />
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Button>
          {isUploading && (
            <Progress value={uploadProgress} className="w-full" />
          )}
          {uploadResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Upload Results:</h3>
              <ul className="list-disc pl-5">
                {uploadResults.map((result, index) => (
                  <li key={index} className={`text-${result.status === 'failed' ? 'red' : 'green'}-600`}>
                    {result.fileName} - {result.status}
                  </li>
                ))}
              </ul>
            </div>
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
