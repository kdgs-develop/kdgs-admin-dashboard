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

const IMAGES_PER_PAGE = 5;

export function ImageTable({ initialSearchQuery = '' }) {
  const [images, setImages] = useState<BucketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<BucketItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageToEdit, setSelectedImageToEdit] =
    useState<BucketItem | null>(null);
  const [selectedImageToRename, setSelectedImageToRename] =
    useState<BucketItem | null>(null);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'lastModified'>('name');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    loadImages(true);
  }, [searchQuery, sortBy]);

  async function loadImages(reset: boolean = false) {
    if (reset) {
      setCursor(null);
      setImages([]);
    }
    setIsLoading(true);
    try {
      const {
        images: newImages,
        hasMore,
        nextCursor,
        totalInBucket
      } = await fetchImagesAction(
        reset ? null : cursor,
        IMAGES_PER_PAGE,
        searchQuery,
        sortBy
      );
      setImages((prev) => (reset ? newImages : [...prev, ...newImages]));
      setTotal(totalInBucket); // Use totalInBucket instead of total
      setHasMore(hasMore);
      setCursor(nextCursor ?? null);
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
    loadImages(true);
  }

  async function handleRotate(fileName: string, degrees: number) {
    await rotateImageAction(fileName, degrees);
    loadImages(true);
  }

  async function handleRename(oldName: string, newName: string) {
    await renameImageAction(oldName, newName);
    loadImages(true);
  }

  function handlePrevPage() {
    // For simplicity, we'll just reset to the first page when going back
    loadImages(true);
  }

  function handleNextPage() {
    if (hasMore) {
      loadImages();
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        {error ? (
          <div className="h-[400px] w-full flex flex-col items-center justify-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => loadImages(true)} variant="outline">
              Retry
            </Button>
          </div>
        ) : (
          <div className="h-[400px] w-full flex flex-col">
            {isLoading && images.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center">
                <Spinner className="h-8 w-8 mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Fetching files...
                </p>
              </div>
            ) : images.length > 0 ? (
              <div className="flex-grow overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => setSortBy('name')}
                        >
                          File Name {sortBy === 'name' && '↓'}
                        </Button>
                      </TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => setSortBy('lastModified')}
                        >
                          Last Modified {sortBy === 'lastModified' && '↓'}
                        </Button>
                      </TableHead>
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
                          {image.lastModified?.toLocaleString() ?? 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => setSelectedImage(image)}
                              variant="ghost"
                              size="sm"
                            >
                              View
                            </Button>
                            <Button
                              onClick={() => setSelectedImageToEdit(image)}
                              variant="ghost"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => setSelectedImageToRename(image)}
                              variant="ghost"
                              size="sm"
                            >
                              Rename
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-sm text-muted-foreground text-center">
                  No results
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {images.length > 0 ? (cursor ? images.length + 1 : 1) : 0}-
          {images.length + (cursor ? images.length : 0)} image files
        </div>
        <div className="space-x-2">
          <Button
            onClick={handlePrevPage}
            disabled={cursor === null || isLoading}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={handleNextPage}
            disabled={!hasMore || isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? <Spinner className="h-4 w-4" /> : 'Next'}
          </Button>
        </div>
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
