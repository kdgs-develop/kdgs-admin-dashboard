'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ObituariesReport } from './obituaries-report';
import { Loader2 } from 'lucide-react';
import { fetchFileBoxesAction } from './actions';
import { useToast } from '@/hooks/use-toast';

const reportTypes = [
  { value: 'unproofread', label: 'Unproofread Obituaries' },
  { value: 'proofread', label: 'Proofread Obituaries' },
  { value: 'filebox', label: 'File Box Report' }
] as const;

interface FileBox {
  id: number;
  year: number;
  number: number;
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<typeof reportTypes[number]['value']>();
  const [selectedFileBox, setSelectedFileBox] = useState<string>();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [fileBoxes, setFileBoxes] = useState<FileBox[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedReport === 'filebox') {
      fetchFileBoxesAction().then(setFileBoxes);
    }
  }, [selectedReport]);

  const handleGeneratePDF = async () => {
    if (!selectedReport) return;
    if (selectedReport === 'filebox' && !selectedFileBox) {
      toast({
        title: "Error",
        description: "Please select a file box",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const endpoint = selectedReport === 'filebox' 
        ? '/api/generate-filebox-report'
        : '/api/generate-report';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          reportType: selectedReport,
          fileBoxId: selectedReport === 'filebox' ? parseInt(selectedFileBox!) : undefined
        })
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
      
      const fileBox = selectedFileBox ? 
        `-box-${fileBoxes.find(b => b.id === parseInt(selectedFileBox))?.year}-${fileBoxes.find(b => b.id === parseInt(selectedFileBox))?.number}` : 
        '';
      link.download = `${selectedReport}${fileBox}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
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
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 items-end">
        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium">Report Type</label>
          <Select onValueChange={(value) => {
            setSelectedReport(value as typeof reportTypes[number]['value']);
            setSelectedFileBox(undefined);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedReport === 'filebox' && (
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">File Box</label>
            <Select onValueChange={setSelectedFileBox}>
              <SelectTrigger>
                <SelectValue placeholder="Select file box" />
              </SelectTrigger>
              <SelectContent>
                {fileBoxes.map((box) => (
                  <SelectItem key={box.id} value={box.id.toString()}>
                    { box.year === 0 ? "None" :

                    `${box.year} : ${box.number}`
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button 
          onClick={handleGeneratePDF} 
          disabled={isGeneratingPDF || !selectedReport || (selectedReport === 'filebox' && !selectedFileBox)}
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate PDF'
          )}
        </Button>
      </div>

      {selectedReport && selectedReport !== 'filebox' && (
        <ObituariesReport reportType={selectedReport} />
      )}
    </div>
  );
}
