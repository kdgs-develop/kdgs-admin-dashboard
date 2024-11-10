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
      title: 'Generating Files',
      description: 'Please wait while we generate your report and images...',
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
        throw new Error('Failed to generate files');
      }

      const { pdf, images } = await response.json();

      const pdfBlob = await fetch(pdf).then(res => res.blob());
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = `${selectedReport}_report.pdf`;
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      window.URL.revokeObjectURL(pdfUrl);

      for (const [index, imageUrl] of images.entries()) {
        const imageBlob = await fetch(imageUrl).then(res => res.blob());
        const imageDownloadUrl = window.URL.createObjectURL(imageBlob);
        const imageLink = document.createElement('a');
        imageLink.href = imageDownloadUrl;
        imageLink.download = `${selectedReport}_image_${index + 1}.jpg`;
        document.body.appendChild(imageLink);
        imageLink.click();
        document.body.removeChild(imageLink);
        window.URL.revokeObjectURL(imageDownloadUrl);
      }

      toast({
        title: 'Files Generated',
        description: 'Your report and images are downloading now.',
        duration: 5000
      });
    } catch (error) {
      console.error('Error generating files:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate files. Please try again.',
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
                  Generating Files...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Download Files
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
