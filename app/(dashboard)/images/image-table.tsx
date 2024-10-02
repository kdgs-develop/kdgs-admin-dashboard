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
import { useEffect, useRef, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@clerk/nextjs';
import { getUserRole } from '@/lib/db';

const IMAGES_PER_PAGE = 5;

export function ImageTable({ initialSearchQuery = '' }) {
  const [images, setImages] = useState<BucketItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<BucketItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageToEdit, setSelectedImageToEdit] = useState<BucketItem | null>(null);
  const [selectedImageToRename, setSelectedImageToRename] = useState<BucketItem | null>(null);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [imagesPerPage, setImagesPerPage] = useState<number>(5);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);

  const tableRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState('400px');

  const [role, setRole] = useState<string | null>(null);
  const { userId } = useAuth();
  useEffect(() => {
    async function fetchRole() {
      const fetchedRole = await getUserRole();
      setRole(fetchedRole ?? '');
    }
    fetchRole();
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    setCursor(null);
    setPrevCursors([]);
    loadImages(true);
  }, [searchQuery, imagesPerPage]);

  useEffect(() => {
    function updateTableHeight() {
      if (tableRef.current) {
        const windowHeight = window.innerHeight;
        const tableTop = tableRef.current.getBoundingClientRect().top;
        const footerHeight = 53; // Adjust this value to match your footer's height
        const cardFooterHeight = 64; // Height of the card's footer (pagination controls)
        const newHeight = windowHeight - tableTop - footerHeight - cardFooterHeight;
        setTableHeight(`${Math.max(newHeight, 400)}px`); // Ensure a minimum height of 400px
      }
    }

    updateTableHeight();
    window.addEventListener('resize', updateTableHeight);

    return () => window.removeEventListener('resize', updateTableHeight);
  }, []);

  async function loadImages(reset: boolean = false) {
    if (reset) {
      setCursor(null);
      setPrevCursors([]);
    }
    setIsLoading(true);
    try {
      const {
        images: newImages,
        hasMore,
        nextCursor
      } = await fetchImagesAction(
        reset ? null : cursor,
        imagesPerPage,
        searchQuery
      );
      setImages(newImages);
      setHasMore(hasMore);
      if (nextCursor) {
        setCursor(nextCursor);
        if (!reset) {
          setPrevCursors(prev => [...prev, cursor!]);
        }
      } else {
        setCursor(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
    if (prevCursors.length > 0) {
      const newCursor = prevCursors[prevCursors.length - 1];
      setCursor(newCursor);
      setPrevCursors(prev => prev.slice(0, -1));
      loadImages();
    } else {
      loadImages(true);
    }
  }

  function handleNextPage() {
    if (hasMore) {
      loadImages();
    }
  }

  return (
    <Card className="flex flex-col h-full">
      <CardContent className="p-0 flex-grow overflow-hidden">
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => loadImages(true)} variant="outline">
              Retry
            </Button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col" ref={tableRef}>
            {isLoading && images.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center">
                <Spinner className="h-8 w-8 mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Fetching files...
                </p>
              </div>
            ) : images.length > 0 ? (
              <div className="flex-grow overflow-auto" style={{ height: tableHeight }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Last Modified</TableHead>
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
                              disabled={role !== 'ADMIN'}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => setSelectedImageToRename(image)}
                              variant="ghost"
                              size="sm"
                              disabled={role !== 'ADMIN'}
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
        <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Images per page
            </div>
          <Select
            value={imagesPerPage.toString()}
            onValueChange={(value) => setImagesPerPage(Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Images per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-x-2">
          <Button
            onClick={handlePrevPage}
            disabled={prevCursors.length === 0 && cursor === null || isLoading}
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
