'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { ImageTable } from './image-table';

export default function ImagesPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Obituary Images</CardTitle>
        <CardDescription>
          View and manage image files from our KDGS storage server.
          <br />
          <br />
          <strong>Please note:</strong> Manually renaming image files may
          severely impact database integrity and storage server functionality.
          Exercise caution when modifying file names.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImageTable initialSearchQuery={searchQuery} />
      </CardContent>
    </Card>
  );
}
