'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ImageTable } from './image-table';
import { UploadImagesDialog } from './upload-images-dialog';
import { UploadIcon } from 'lucide-react';

export default function ImagesPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Obituary Images</CardTitle>
          <CardDescription>
            View and manage image files from our KDGS storage server.
          </CardDescription>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <UploadIcon className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
      </CardHeader>
      <CardContent>
        <ImageTable initialSearchQuery={searchQuery} />
      </CardContent>
      <UploadImagesDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
      />
    </Card>
  );
}
