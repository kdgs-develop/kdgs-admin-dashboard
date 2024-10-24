'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { getUserData, Obituary as ObituaryType } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { startTransition, useEffect, useState } from 'react';
import { createImageFileAction, createObituaryAction, fetchObituariesAction, getEditObituaryDialogData } from './actions';
import { AddObituaryDialog } from './add-obituary-dialog';
import { CreateFileNumberDialog } from './create-file-number-dialog';
import { Obituary } from './obituary';

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
  const [currentUserFullName, setCurrentUserFullName] = useState<string | null>(null);
  const [isCreateFileNumberDialogOpen, setIsCreateFileNumberDialogOpen] = useState(false);

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
    router.push(`/?offset=${newOffset}&q=${search}`, { scroll: false });
  }

  function nextPage() {
    const newOffset = offset + limit;
    router.push(`/?offset=${newOffset}&q=${search}`, { scroll: false });
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className='mb-1'>Obituary Index</CardTitle>
            <CardDescription>
              Manage obituaries, view their details, and add associated image
              files. 
              <span className='block mt-4' />
              <strong>Please note:</strong> Before adding a new obituary, we strongly recommend using the search bar to look for any matching records in our existing index to avoid duplicates.
            </CardDescription>
          </div>
          <div className='flex gap-2'>
          <Button
    disabled={
      role !== 'ADMIN' && role !== 'PROOFREADER' && role !== 'INDEXER'
    }
    onClick={() => setIsCreateFileNumberDialogOpen(true)}
    >
    Create File Number
  </Button>
          <Button
            disabled={
              role !== 'ADMIN' && role !== 'PROOFREADER' && role !== 'INDEXER'
            }
            onClick={async () => {
              if (!dialogData) {
                const data = await getEditObituaryDialogData();
                setDialogData(data);
              }
              setIsAddDialogOpen(true);
            }}
            variant='destructive'
            >
            Add Obituary
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
                <TableHead>Proofread</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obituaries.map(
                (obituary) =>
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
            {Math.min(offset + limit, totalObituaries)} of {totalObituaries}{' '}
            obituaries
          </div>
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
        </CardFooter>
      </Card>
      {dialogData && (
        <AddObituaryDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSave={(newObituary) => {
            setObituaries([...obituaries, newObituary]);
            setTotalObituaries(totalObituaries + 1);
          }}
          {...dialogData}
          role={role}
          currentUserFullName={currentUserFullName ?? ''}
        />
      )}
      <CreateFileNumberDialog
        isOpen={isCreateFileNumberDialogOpen}
        onClose={() => setIsCreateFileNumberDialogOpen(false)}
        onSave={(newObituary) => {
          startTransition(() => {
            router.push(`/?q=${newObituary?.reference!}`);
          });
        }}
      />
    </>
  );
}
