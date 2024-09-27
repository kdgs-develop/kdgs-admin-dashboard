'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FileIcon, UploadIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { GenerateFileNameDialog } from './generate-file-name-dialog';
import { ImageTable } from './image-table';
import { UploadImagesDialog } from './upload-images-dialog';

export default function ImagesPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Obituary Images</CardTitle>
          <CardDescription>
            View and manage image files from our KDGS storage server.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsGenerateDialogOpen(true)}
          >
            <FileIcon className="mr-2 h-4 w-4" />
            Generate New File Name
          </Button>
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <UploadIcon className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ImageTable initialSearchQuery={searchQuery} />
      </CardContent>
      <GenerateFileNameDialog
        isOpen={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
      />
      <UploadImagesDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
      />
    </Card>
  );
}
