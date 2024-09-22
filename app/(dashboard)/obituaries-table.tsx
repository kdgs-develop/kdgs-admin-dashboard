'use client';

import {
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  Table
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Obituary } from './obituary';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Obituary as ObituaryType } from '@/lib/db';

export function ObituariesTable({
  obituaries,
  offset,
  totalObituaries,
  onRefresh,
  search
}: {
  obituaries: ObituaryType[];
  offset: number;
  totalObituaries: number;
  onRefresh: () => Promise<{ obituaries: ObituaryType[]; total: number }>;
  search: string;
}) {
  const router = useRouter();
  const obituariesPerPage = 5;

  function prevPage() {
    const newOffset = Math.max(offset - obituariesPerPage, 0);
    router.push(`/?offset=${newOffset}&q=${search}`, { scroll: false });
  }

  function nextPage() {
    const newOffset = offset + obituariesPerPage;
    router.push(`/?offset=${newOffset}&q=${search}`, { scroll: false });
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Obituaries</CardTitle>
        <CardDescription>
          Manage obituaries and view their details.
        </CardDescription>
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
              obituary && <Obituary key={obituary.id} obituary={obituary} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <form className="flex items-center w-full justify-between">
          <div className="text-xs text-muted-foreground">
            Showing{' '}
            <strong>
              {Math.min(offset + 1, totalObituaries)}-{Math.min(offset + obituariesPerPage, totalObituaries)}
            </strong>{' '}
            of <strong>{totalObituaries}</strong> obituaries
          </div>
          <div className="flex">
            <Button
              onClick={prevPage}
              variant="ghost"
              size="sm"
              type="button"
              disabled={offset === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Prev
            </Button>
            <Button
              onClick={nextPage}
              variant="ghost"
              size="sm"
              type="button"
              disabled={offset + obituariesPerPage >= totalObituaries}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}