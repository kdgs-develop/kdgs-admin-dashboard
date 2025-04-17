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
import { FilePlus } from "lucide-react";
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
  refreshTrigger
}: {
  offset: number;
  limit: number;
  search: string;
  refreshTrigger: number;
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

  useEffect(() => {
    async function fetchUserData() {
      const fetchedUserData = await getUserData();
      setRole(fetchedUserData?.role!);
      setCurrentUserFullName(fetchedUserData?.fullName!);
    }

    fetchUserData();
  }, []);

  useEffect(() => {
    fetchObituariesAction(offset, limit, search).then(
      ({ obituaries, total }) => {
        setObituaries(obituaries ?? []);
        setTotalObituaries(total);
      }
    );
  }, [offset, limit, search, refreshTrigger]);

  function prevPage() {
    const newOffset = Math.max(offset - limit, 0);
    router.push(`/?offset=${newOffset}&limit=${limit}&q=${search}`, {
      scroll: false
    });
  }

  function nextPage() {
    const newOffset = offset + limit;
    router.push(`/?offset=${newOffset}&limit=${limit}&q=${search}`, {
      scroll: false
    });
  }

  function handleItemsPerPageChange(value: string) {
    const newLimit = parseInt(value, 10);
    router.push(`/?offset=0&limit=${newLimit}&q=${search}`, { scroll: false });
  }

  return (
    <>
      <Card className="w-full">
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
          <Table>
            <TableHeader>
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
              {obituaries.map(
                obituary =>
                  obituary && (
                    <Obituary
                      key={obituary.id}
                      obituary={obituary}
                      onUpdate={() => {
                        fetchObituariesAction(offset, limit, search).then(
                          ({ obituaries, total }) => {
                            setObituaries(obituaries ?? []);
                            setTotalObituaries(total);
                          }
                        );
                      }}
                      role={role}
                    />
                  )
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(offset + 1, totalObituaries)}-
            {Math.min(offset + limit, totalObituaries)} of {totalObituaries}{" "}
            obituaries
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={limit.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-x-2">
              <Button
                onClick={prevPage}
                disabled={offset === 0}
                variant="outline"
                size="sm"
              >
                Previous
              </Button>
              <Button
                onClick={nextPage}
                disabled={offset + limit >= totalObituaries}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
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
