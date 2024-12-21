'use client';

import { Spinner } from '@/components/icons';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Download, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  deleteReportAction,
  fetchReportsAction,
  getReportUrlAction
} from './actions';
import { DeleteReportDialog } from './delete-report-dialog';

const REPORTS_PER_PAGE = 5;

interface Report {
  id: string;
  fileName: string;
  searchQuery: string;
  createdAt: Date;
  createdBy: {
    fullName: string;
  };
  role: string;
  totalResults: number;
}

export function ReportsTable() {
  const [reports, setReports] = useState<Report[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, [currentPage]);

  async function loadReports() {
    setIsLoading(true);
    try {
      const { reports, total } = await fetchReportsAction(
        currentPage,
        REPORTS_PER_PAGE
      );
      setReports(reports as Report[]);
      setTotalReports(total);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownload(report: Report) {
    try {
      const fileName = report.fileName
      const url = await getReportUrlAction(fileName);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download report');
      }

      // Create a new blob with application/pdf MIME type
      const blob = await response.blob();
      // Create the URL and force download with the correct filename
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Success',
        description: 'Report downloaded successfully'
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Error',
        description: 'Failed to download report',
        variant: 'destructive'
      });
    }
  }

  async function handleDelete(report: Report) {
    try {
      await deleteReportAction(report.id, report.fileName);
      toast({
        title: 'Success',
        description: 'Report deleted successfully'
      });
      loadReports();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete report',
        variant: 'destructive'
      });
    }
    setSelectedReport(null);
  }

  const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
  const endIndex = Math.min(startIndex + REPORTS_PER_PAGE, totalReports);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Reports</CardTitle>
        <CardDescription>
          View and manage your generated search reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-8 w-8" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reports found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Search Query</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Total Results</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.fileName}</TableCell>
                  <TableCell>{report.searchQuery}</TableCell>
                  <TableCell>{report.createdBy.fullName}</TableCell>
                  <TableCell>{report.role}</TableCell>
                  <TableCell>
                    {format(new Date(report.createdAt), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                  <TableCell>{report.totalResults}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleDownload(report)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setSelectedReport(report)}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{endIndex} of {totalReports} reports
        </div>
        <div className="space-x-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, Math.ceil(totalReports / REPORTS_PER_PAGE))
              )
            }
            disabled={endIndex >= totalReports}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      </CardFooter>
      {selectedReport && (
        <DeleteReportDialog
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onConfirm={() => handleDelete(selectedReport)}
        />
      )}
    </Card>
  );
}
