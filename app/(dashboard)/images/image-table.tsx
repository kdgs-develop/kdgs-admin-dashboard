'use client';

import { Spinner } from '@/components/icons';
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
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EditImageDialog } from './edit-image-dialog';
import {
  deleteImageAction,
  fetchImagesAction,
  getImageUrlAction,
  renameImageAction,
  rotateImageAction
} from './minio-actions';
import { RenameImageDialog } from './rename-image-dialog';
import { ViewImageDialog } from './view-image-dialog';

export function ImageTable({ initialSearchQuery = '' }) {
  const [images, setImages] = useState<BucketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<BucketItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageToEdit, setSelectedImageToEdit] =
    useState<BucketItem | null>(null);
  const [selectedImageToRename, setSelectedImageToRename] =
    useState<BucketItem | null>(null);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    loadImages();
  }, [page, searchQuery]);

  async function loadImages() {
    setIsLoading(true);
    try {
      const { images, total } = await fetchImagesAction(page, 5, searchQuery);
      setImages(images);
      setTotal(total);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
      console.error('Error loading images:', err);
    } finally {
      setIsLoading(false);
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

  async function handleRename(oldName: string, newName: string) {
    await renameImageAction(oldName, newName);
    loadImages();
  }

  return (
    <Card>
      <CardContent className="p-0">
        {error ? (
          <div className="text-red-500 p-6">{error}</div>
        ) : (
          <div className="min-h-[300px] w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px]">
                <Spinner className="h-8 w-8 mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Fetching files...
                </p>
              </div>
            ) : images.length > 0 ? (
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
                        <div className="flex space-x-2">
                          <Button onClick={() => setSelectedImage(image)}>
                            View
                          </Button>
                          <Button onClick={() => setSelectedImageToEdit(image)}>
                            Edit
                          </Button>
                          <Button
                            onClick={() => setSelectedImageToRename(image)}
                          >
                            Rename
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center w-full h-full min-h-[300px]">
                <p className="text-sm text-muted-foreground text-center">
                  No results
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        {total > 0 ? (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * 5 + 1, total)}-
              {Math.min(page * 5, total)} of {total} image files
            </div>
            <div className="space-x-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || isLoading}
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page * 5 >= total || isLoading}
              >
                Next
              </Button>
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            No image files found
          </div>
        )}
      </CardFooter>
      {selectedImage && (
        <ViewImageDialog
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onRotate={handleRotate}
          getImageUrl={getImageUrlAction}
        />
      )}
      {selectedImageToEdit && (
        <EditImageDialog
          image={selectedImageToEdit}
          onClose={() => setSelectedImageToEdit(null)}
          onDelete={handleDelete}
          onRotate={handleRotate}
          getImageUrl={getImageUrlAction}
        />
      )}
      {selectedImageToRename && (
        <RenameImageDialog
          image={selectedImageToRename}
          onClose={() => setSelectedImageToRename(null)}
          onRename={handleRename}
        />
      )}
    </Card>
  );
}
