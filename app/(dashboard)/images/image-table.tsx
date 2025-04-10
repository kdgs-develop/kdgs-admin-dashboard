"use client";

import { Spinner } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getUserRole, ImageWithObituary } from "@/lib/db";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EditImageDialog } from "./edit-image-dialog";
import {
  deleteImageAction,
  fetchImagesAction,
  getImageCountAction,
  getImageUrlAction,
  renameImageAction,
  rotateImageAction
} from "./minio-actions";
import { RenameImageDialog } from "./rename-image-dialog";
import { ViewImageDialog } from "./view-image-dialog";
import { cn } from "@/lib/utils";

const IMAGES_PER_PAGE = 5;

export type OrderField =
  | "fileNameAsc"
  | "fileNameDesc"
  | "lastModifiedAsc"
  | "lastModifiedDesc";

export function ImageTable({ initialSearchQuery = "" }) {
  const [images, setImages] = useState<ImageWithObituary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageWithObituary | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedImageToEdit, setSelectedImageToEdit] =
    useState<ImageWithObituary | null>(null);
  const [selectedImageToRename, setSelectedImageToRename] =
    useState<ImageWithObituary | null>(null);
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [imagesPerPage, setImagesPerPage] = useState<number>(25);
  const [prevCursors, setPrevCursors] = useState<string[]>([]);
  const [obituaryFilter, setObituaryFilter] = useState<"all" | "has" | "no">(
    "all"
  );
  const [totalImages, setTotalImages] = useState<number>(0);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState("400px");
  const tableContentRef = useRef<HTMLDivElement>(null);

  const [role, setRole] = useState<string | null>(null);
  const { userId } = useAuth();

  useEffect(() => {
    async function fetchRole() {
      const fetchedRole = await getUserRole();
      setRole(fetchedRole ?? "");
    }
    fetchRole();
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const [orderBy, setOrderBy] = useState<OrderField>("lastModifiedDesc");

  useEffect(() => {
    setCursor(null);
    setPrevCursors([]);
    loadImages(true);
    fetchTotalImages();
  }, [searchQuery, orderBy, obituaryFilter]);

  // Separate effect for imagesPerPage since it doesn't affect total count
  useEffect(() => {
    setCursor(null);
    setPrevCursors([]);
    loadImages(true);
  }, [imagesPerPage]);

  useEffect(() => {
    function updateTableHeight() {
      if (tableRef.current) {
        const windowHeight = window.innerHeight;
        const tableTop = tableRef.current.getBoundingClientRect().top;
        const footerHeight = 24; // Reasonable footer spacing
        const cardFooterHeight = 120; // Footer controls height
        const layoutPadding = 24; // Account for layout padding
        const additionalPadding = isCompactMode ? 10 : 20; // Some extra padding for breathing room
        const newHeight =
          windowHeight -
          tableTop -
          footerHeight -
          cardFooterHeight -
          layoutPadding -
          additionalPadding;

        // Reasonable minimum heights
        const minHeight = isCompactMode ? 200 : 300;
        setTableHeight(`${Math.max(newHeight, minHeight)}px`);
      }
    }

    updateTableHeight();
    window.addEventListener("resize", updateTableHeight);

    return () => window.removeEventListener("resize", updateTableHeight);
  }, [isCompactMode]);

  // Add useEffect to handle scroll reset
  useEffect(() => {
    if (tableContentRef.current && images.length > 0) {
      tableContentRef.current.scrollTop = 0;
    }
  }, [images]);

  useEffect(() => {
    fetchTotalImages();
  }, []);

  async function fetchTotalImages() {
    setIsCountLoading(true);
    try {
      const count = await getImageCountAction(searchQuery, obituaryFilter);
      setTotalImages(count);
    } catch (err) {
      console.error("Error fetching total image count:", err);
    } finally {
      setIsCountLoading(false);
    }
  }

  async function loadImages(reset: boolean = false) {
    setIsLoading(true);
    setImages([]);

    try {
      const {
        images: newImages,
        hasMore,
        nextCursor
      } = await fetchImagesAction(
        reset ? null : cursor,
        imagesPerPage,
        searchQuery,
        orderBy,
        obituaryFilter
      );

      setImages(newImages);
      setHasMore(hasMore);

      if (reset) {
        setCursor(null);
        setPrevCursors([]);
      } else if (nextCursor) {
        setCursor(nextCursor);
        cursor && setPrevCursors(prev => [...prev, cursor]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(fileName: string) {
    await deleteImageAction(fileName);
    loadImages(true);
  }

  async function handleRotate(fileName: string) {
    await rotateImageAction(fileName);
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
      tableContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      loadImages(true);
      tableContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleNextPage() {
    if (hasMore) {
      loadImages();
      tableContentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div className="pb-0">
      <Card className="flex flex-col h-full mb-0">
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
              {isLoading ? (
                <div className="flex-grow flex flex-col items-center justify-center loading-indicator">
                  <Spinner className="h-8 w-8 mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    {images.length === 0
                      ? "Sorting Images..."
                      : "Fetching files..."}
                  </p>
                </div>
              ) : images.length > 0 ? (
                <div
                  ref={tableContentRef}
                  className="flex-grow overflow-auto"
                  style={{ height: tableHeight }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow className={cn(isCompactMode && "h-8")}>
                        <TableHead>File Name</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Last Modified</TableHead>
                        <TableHead>Has Obituary</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {images.map(image => (
                        <TableRow
                          key={image.name}
                          className={cn(isCompactMode && "h-10")}
                        >
                          <TableCell className={cn(isCompactMode && "py-1")}>
                            {image.name?.split(".")[0] ?? "Unnamed"}
                          </TableCell>
                          <TableCell className={cn(isCompactMode && "py-1")}>
                            {image.name?.split(".").pop() ?? "Unknown"}
                          </TableCell>
                          <TableCell className={cn(isCompactMode && "py-1")}>
                            {((image.size ?? 0) / 1024).toFixed(2)} KB
                          </TableCell>
                          <TableCell className={cn(isCompactMode && "py-1")}>
                            {image.lastModified?.toLocaleString() ?? "Unknown"}
                          </TableCell>
                          <TableCell className={cn(isCompactMode && "py-1")}>
                            {image.obituary ? "Yes" : "No"}
                          </TableCell>
                          <TableCell className={cn(isCompactMode && "py-1")}>
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => setSelectedImage(image)}
                                size="sm"
                                className={cn(
                                  "bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200",
                                  isCompactMode && "h-7 text-xs px-2"
                                )}
                              >
                                View
                              </Button>
                              <Button
                                onClick={() => setSelectedImageToEdit(image)}
                                size="sm"
                                disabled={role !== "ADMIN"}
                                className={cn(
                                  "bg-gray-500 hover:bg-gray-600 text-white transition-colors duration-200",
                                  isCompactMode && "h-7 text-xs px-2"
                                )}
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() => setSelectedImageToRename(image)}
                                size="sm"
                                disabled={role !== "ADMIN"}
                                className={cn(
                                  "bg-gray-400 hover:bg-gray-500 text-white transition-colors duration-200",
                                  isCompactMode && "h-7 text-xs px-2"
                                )}
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
        <CardFooter className="flex flex-col space-y-2 p-3">
          {/* Top row with filter controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Images per page
              </div>
              <Select
                value={imagesPerPage.toString()}
                onValueChange={value => setImagesPerPage(Number(value))}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="Images per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Filter by Obituary
              </div>
              <Select
                value={obituaryFilter}
                onValueChange={value => {
                  setObituaryFilter(value as "all" | "has" | "no");
                  loadImages(true);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by Obituary" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="has">Has Obituary</SelectItem>
                  <SelectItem value="no">No Obituary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Order by</div>
              <Select
                value={orderBy}
                onValueChange={(value: OrderField) => {
                  setIsLoading(true);
                  setOrderBy(value);
                  setImages([]);
                  loadImages(true);
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Order by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastModifiedDesc">
                    Last Modified (Newest First)
                  </SelectItem>
                  <SelectItem value="lastModifiedAsc">
                    Last Modified (Oldest First)
                  </SelectItem>
                  <SelectItem value="fileNameAsc">File Name (A-Z)</SelectItem>
                  <SelectItem value="fileNameDesc">File Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center">
              <Button
                onClick={() => {
                  setIsCompactMode(!isCompactMode);
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                {isCompactMode ? "Normal View" : "Compact View"}
              </Button>
            </div>
          </div>

          {/* Bottom row with pagination and count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
              {isCountLoading ? (
                <Spinner className="h-3 w-3 mr-2" />
              ) : (
                <span className="text-sm font-medium">{totalImages}</span>
              )}
              <span className="text-sm text-muted-foreground ml-1">
                images total
              </span>
            </div>

            <div className="space-x-2">
              <Button
                onClick={handlePrevPage}
                disabled={
                  (prevCursors.length === 0 && cursor === null) || isLoading
                }
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
                {isLoading ? <Spinner className="h-4 w-4" /> : "Next"}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
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
    </div>
  );
}
