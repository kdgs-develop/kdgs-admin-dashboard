"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { getUserData, Obituary as ObituaryType } from "@/lib/db";
import { FilePlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { fetchObituariesAction, getEditObituaryDialogData } from "./actions";
import { AddObituaryDialog } from "./add-obituary-dialog";
import { CreateFileNumberDialog } from "./create-file-number-dialog";
import { Obituary } from "./obituary";

interface AddObituaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newObituary: ObituaryType) => void;
  titles: { id: number; name: string }[];
  cities: {
    id: number;
    name: string;
    province?: string | null;
    country?: { name: string } | null;
  }[];
  periodicals: { id: number; name: string }[];
  familyRelationships: { id: string; name: string; category: string }[];
  fileBoxes: { id: number; year: number; number: number }[];
  role: string | null;
  currentUserFullName: string;
}

export function ObituariesTable({
  offset,
  limit,
  search,
  refreshTrigger,
  onLoadingChange
}: {
  offset: number;
  limit: number;
  search: string;
  refreshTrigger: number;
  onLoadingChange?: (isLoading: boolean) => void;
}) {
  const router = useRouter();
  const [obituaries, setObituaries] = useState<ObituaryType[]>([]);
  const [totalObituaries, setTotalObituaries] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<Awaited<
    ReturnType<typeof getEditObituaryDialogData>
  > | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [currentUserFullName, setCurrentUserFullName] = useState<string | null>(
    null
  );
  const [isCreateFileNumberDialogOpen, setIsCreateFileNumberDialogOpen] =
    useState(false);
  const [loadingButton, setLoadingButton] = useState<"prev" | "next" | null>(
    null
  );
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      const fetchedUserData = await getUserData();
      setRole(fetchedUserData?.role!);
      setCurrentUserFullName(fetchedUserData?.fullName!);
    }

    fetchUserData();
  }, []);

  useEffect(() => {
    setIsLoadingData(true);
    onLoadingChange?.(true);
    fetchObituariesAction(offset, limit, search)
      .then(({ obituaries, total }) => {
        setObituaries(obituaries ?? []);
        setTotalObituaries(total);
      })
      .finally(() => {
        setIsLoadingData(false);
        onLoadingChange?.(false);
      });
  }, [offset, limit, search, refreshTrigger, onLoadingChange]);

  function prevPage() {
    setLoadingButton("prev");
    const newOffset = Math.max(offset - limit, 0);
    router.push(`/dashboard/?offset=${newOffset}&limit=${limit}&q=${search}`, {
      scroll: false
    });
  }

  function nextPage() {
    setLoadingButton("next");
    const newOffset = offset + limit;
    router.push(`/dashboard/?offset=${newOffset}&limit=${limit}&q=${search}`, {
      scroll: false
    });
  }

  function handleItemsPerPageChange(value: string) {
    setLoadingButton(null);
    const newLimit = parseInt(value, 10);
    router.push(`/dashboard/?offset=0&limit=${newLimit}&q=${search}`, {
      scroll: false
    });
  }

  useEffect(() => {
    setLoadingButton(null);
  }, [obituaries]);

  return (
    <>
      <Card className="w-full mb-4">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="mb-1">Obituary Index</CardTitle>
            <CardDescription>
              <span className="block mt-2" />
              Manage obituaries, view their details, and add associated image
              files.
              <span className="block mt-4" />
              <strong>Search:</strong> Type any name or file number for regular
              search. For specific searches, use the dropdown menu to select
              search types.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={
                role !== "ADMIN" && role !== "PROOFREADER" && role !== "INDEXER"
              }
              onClick={() => setIsCreateFileNumberDialogOpen(true)}
              className="flex gap-2 items-center justify-center w-32 h-10 mr-5 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 "
            >
              <FilePlus className="h-4 w-4" />
              New Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="hidden table:table-header-group">
                <TableRow>
                  <TableHead>File Number</TableHead>
                  <TableHead>Surname</TableHead>
                  <TableHead>Given Names</TableHead>
                  <TableHead>Death Date</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Proofread</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingData
                  ? // Loading skeleton rows
                    Array.from({ length: limit }).map((_, index) => (
                      <>
                        {/* Desktop Loading Skeleton */}
                        <TableRow
                          key={`loading-${index}`}
                          className="hidden table:table-row"
                        >
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-12"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-16"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted animate-pulse rounded w-8"></div>
                          </TableCell>
                        </TableRow>
                        {/* Mobile Loading Skeleton */}
                        <TableRow
                          key={`loading-mobile-${index}`}
                          className="table:hidden"
                        >
                          <TableCell colSpan={7} className="p-0">
                            <div className="p-4 space-y-3 border-b">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                                <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
                                <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                                <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-muted animate-pulse rounded w-16"></div>
                                <div className="h-4 bg-muted animate-pulse rounded w-12"></div>
                              </div>
                              <div className="flex gap-2">
                                <div className="h-8 bg-muted animate-pulse rounded flex-1"></div>
                                <div className="h-8 bg-muted animate-pulse rounded flex-1"></div>
                                <div className="h-8 bg-muted animate-pulse rounded flex-1"></div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </>
                    ))
                  : obituaries.map(
                      obituary =>
                        obituary && (
                          <Obituary
                            key={obituary.id}
                            obituary={obituary}
                            onUpdate={() => {
                              setIsLoadingData(true);
                              fetchObituariesAction(offset, limit, search)
                                .then(({ obituaries, total }) => {
                                  setObituaries(obituaries ?? []);
                                  setTotalObituaries(total);
                                })
                                .finally(() => {
                                  setIsLoadingData(false);
                                });
                            }}
                            role={role}
                          />
                        )
                    )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="text-sm text-muted-foreground">
              {isLoadingData ? (
                <div className="h-4 bg-muted animate-pulse rounded w-48"></div>
              ) : (
                <>
                  Showing {Math.min(offset + 1, totalObituaries)}-
                  {Math.min(offset + limit, totalObituaries)} of{" "}
                  {totalObituaries} obituaries
                </>
              )}
            </div>
            <Select
              value={limit.toString()}
              onValueChange={handleItemsPerPageChange}
              disabled={loadingButton !== null || isLoadingData}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={prevPage}
              disabled={offset === 0 || loadingButton !== null || isLoadingData}
              variant="outline"
              size="sm"
              className="w-[80px]"
            >
              {loadingButton === "prev" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Previous"
              )}
            </Button>
            <Button
              onClick={nextPage}
              disabled={
                offset + limit >= totalObituaries ||
                loadingButton !== null ||
                isLoadingData
              }
              variant="outline"
              size="sm"
              className="w-[80px]"
            >
              {loadingButton === "next" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
      {dialogData && (
        <AddObituaryDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSave={newObituary => {
            setObituaries([...obituaries, newObituary]);
            setTotalObituaries(totalObituaries + 1);
          }}
          {...dialogData}
          role={role}
          currentUserFullName={currentUserFullName ?? ""}
          cities={dialogData.cities.map(city => ({
            id: city.id,
            name: city.name || "",
            province: city.province,
            country: city.country
          }))}
          familyRelationships={dialogData.familyRelationships}
        />
      )}
      <CreateFileNumberDialog
        isOpen={isCreateFileNumberDialogOpen}
        onClose={() => setIsCreateFileNumberDialogOpen(false)}
        onSave={newObituary => {
          startTransition(() => {
            router.push(`/?q=${newObituary?.reference!}`);
          });
        }}
      />
    </>
  );
}
