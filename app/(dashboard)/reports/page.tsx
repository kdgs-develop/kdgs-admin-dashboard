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
    toast({
      title: 'Generating PDF',
      description: 'Please wait while we generate your report...',
      duration: 3000
    });

    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reportType: selectedReport })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedReport}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF Generated',
        description: 'Your report is ready and downloading now.',
        duration: 5000
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
        duration: 5000
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
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
