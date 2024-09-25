'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { BucketItem } from 'minio';
import { useEffect, useState } from 'react';
import { ImageDialog } from './image-dialog';
import {
  deleteImageAction,
  fetchImagesAction,
  getImageUrlAction,
  rotateImageAction
} from './minio-actions';

export function ImageTable() {
  const [images, setImages] = useState<BucketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<BucketItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [page]);

  async function loadImages() {
    try {
      const { images, total } = await fetchImagesAction(page);
      setImages(images);
      setTotal(total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error loading images:', err);
    }
  }

  async function handleDelete(fileName: string) {
    await deleteImageAction(fileName);
    loadImages();
  }

  async function handleRotate(fileName: string, degrees: number) {
    await rotateImageAction(fileName, degrees);
    loadImages();
  }

  return (
    <Card>
      <CardContent>
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {images.map((image) => (
              <TableRow key={image.name}>
                <TableCell>{image.name ?? 'Unnamed'}</TableCell>
                <TableCell>
                  {image.name?.split('.').pop() ?? 'Unknown'}
                </TableCell>
                <TableCell>
                  {((image.size ?? 0) / 1024).toFixed(2)} KB
                </TableCell>
                <TableCell>
                  <Button onClick={() => setSelectedImage(image)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
      <CardFooter className='flex justify-end gap-4'>
        <Button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Previous
        </Button>
        <Button onClick={() => setPage(page + 1)} disabled={page * 5 >= total}>
          Next
        </Button>
      </CardFooter>
      {selectedImage && (
        <ImageDialog
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDelete}
          onRotate={handleRotate}
          getImageUrl={getImageUrlAction}
        />
      )}
    </Card>
  );
}
