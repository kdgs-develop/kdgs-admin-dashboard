'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ObituariesReport } from './obituaries-report';
import { format } from 'date-fns';

const reportTypes = [
  { value: 'unproofread', label: 'Unproofread Obituaries' },
  { value: 'proofread', label: 'Proofread Obituaries' }
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<
    'unproofread' | 'proofread' | undefined
  >();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    if (!selectedReport) return;

    setIsGeneratingPDF(true);
    
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportType: selectedReport })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      const { pdf } = await response.json();

      // Download PDF
      const pdfBlob = await fetch(pdf).then(res => res.blob());
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `obituaries-${selectedReport}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(pdfUrl);

      toast({
        title: "Success",
        description: "Report generated successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              onValueChange={(value: 'unproofread' | 'proofread') =>
                setSelectedReport(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a report type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((report) => (
                  <SelectItem key={report.value} value={report.value}>
                    {report.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedReport && <ObituariesReport reportType={selectedReport} />}

            <Button
              onClick={handleGeneratePDF}
              disabled={!selectedReport || isGeneratingPDF}
              className="w-full"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
