'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ImageTable } from './image-table';
import { useSearchParams } from 'next/navigation';

export default function ImagesPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Obituary Image Files</CardTitle>
        <CardDescription>
          View and manage image files stored in Minio S3.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImageTable initialSearchQuery={searchQuery} />
      </CardContent>
    </Card>
  );
}