'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Obituary } from './obituary';
import { Obituary as ObituaryType } from '@/lib/db';
import { fetchObituariesAction } from './actions';
import { AddObituaryDialog } from './add-obituary-dialog';
import { getEditObituaryDialogData } from './actions';

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
  const [dialogData, setDialogData] = useState<Awaited<ReturnType<typeof getEditObituaryDialogData>> | null>(null);

  useEffect(() => {
    fetchObituariesAction(offset, limit, search).then(({ obituaries, total }) => {
      setObituaries(obituaries ?? []);
      setTotalObituaries(total);
    });
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Obituaries</CardTitle>
          <CardDescription>
            Manage obituaries and view their details.
          </CardDescription>
        </div>
        <Button
          onClick={async () => {
            if (!dialogData) {
              const data = await getEditObituaryDialogData();
              setDialogData(data);
            }
            setIsAddDialogOpen(true);
          }}
        >
          Add Obituary
        </Button>
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
            {obituaries.map((obituary) => (
              obituary && (
                <Obituary
                  key={obituary.id}
                  obituary={obituary}
                  onUpdate={() => {
                    fetchObituariesAction(offset, limit, search).then(({ obituaries, total }) => {
                      setObituaries(obituaries ?? []);
                      setTotalObituaries(total);
                    });
                  }}
                />
              )
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min(offset + 1, totalObituaries)}-
          {Math.min(offset + limit, totalObituaries)} of {totalObituaries} obituaries
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
    />
)}
    </>
  );
}