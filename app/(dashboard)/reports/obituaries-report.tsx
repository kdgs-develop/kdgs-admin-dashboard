'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Obituary } from '@/lib/db';
import { useEffect, useState } from 'react';
import { fetchObituariesAction } from './actions';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 25;

interface ObituariesReportProps {
  reportType: 'proofread' | 'unproofread';
}

export function ObituariesReport({ reportType }: ObituariesReportProps) {
  const [obituaries, setObituaries] = useState<Obituary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalObituaries, setTotalObituaries] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    fetchObituariesAction(reportType, currentPage, ITEMS_PER_PAGE)
      .then(({ obituaries, total }) => {
        setObituaries(obituaries);
        setTotalObituaries(total);
      })
      .finally(() => setIsLoading(false));
  }, [reportType, currentPage]);

  const totalPages = Math.ceil(totalObituaries / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const reportTitle = reportType === 'proofread' ? 'Proofread Obituaries Report' : 'Unproofread Obituaries Report';

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{reportTitle}</h2>
      {obituaries.length === 0 ? (
        <p className="text-center text-muted-foreground">No {reportType} obituaries found.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Number</TableHead>
                <TableHead>Surname</TableHead>
                <TableHead>Given Names</TableHead>
                <TableHead>Death Date</TableHead>
                <TableHead>Proofread</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {obituaries.map((obituary) => (
                <TableRow key={obituary.id}>
                  <TableCell>{obituary.reference}</TableCell>
                  <TableCell>{obituary.surname}</TableCell>
                  <TableCell>{obituary.givenNames}</TableCell>
                  <TableCell>{obituary.deathDate?.toISOString().split('T')[0] || 'N/A'}</TableCell>
                  <TableCell>{obituary.proofread ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
