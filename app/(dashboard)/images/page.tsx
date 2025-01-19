'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Suspense } from 'react';
import { ImageTableWrapper } from './image-table-wrapper';

export default function ImagesPage() {
  return (
    <div className="container mx-auto p-4 max-w-[calc(4xl)]">
      <Card>
        <CardHeader>
          <CardTitle>Obituary Images</CardTitle>
          <CardDescription>
            View and manage image files from our KDGS storage server.
            <span className="block mt-4" />
            <strong>Please note:</strong> Manually renaming image files may
            severely impact database integrity and storage server functionality.
            Exercise caution when modifying file names.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <ImageTableWrapper />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
