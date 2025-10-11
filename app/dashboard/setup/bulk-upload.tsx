"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import path from "path";
import { useCallback, useState } from "react";
import { OverwriteConfirmationDialog } from "./overwrite-confirmation-dialog";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";

export function BulkUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<
    {
      fileName: string;
      status: "uploaded" | "skipped" | "overwritten" | "failed";
    }[]
  >([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = useCallback(() => {
    if (!files || files.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to upload.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResults([]);
    processNextFile(Array.from(files), 0);
  }, [files]);

  const uploadFile = useCallback(
    async (file: File): Promise<"uploaded" | "skipped" | "overwritten"> => {
      const formData = new FormData();
      formData.append("file", file);

      const filenameWithoutExt = path.parse(file.name).name;
      const checkResponse = await fetch(
        `/api/check-file-exists?filename=${encodeURIComponent(filenameWithoutExt)}`,
        { method: "GET" }
      );

      if (!checkResponse.ok) {
        throw new Error("Failed to check file existence");
      }

      const { exists } = await checkResponse.json();

      if (exists) {
        return new Promise(resolve => {
          setOverwriteDialogOpen(true);
          const handleConfirm = async () => {
            setOverwriteDialogOpen(false);
            await performUpload(formData);
            resolve("overwritten");
          };
          const handleCancel = () => {
            setOverwriteDialogOpen(false);
            resolve("skipped");
          };
          setOverwriteHandlers({ handleConfirm, handleCancel });
        });
      } else {
        await performUpload(formData);
        return "uploaded";
      }
    },
    []
  );

  const processNextFile = useCallback(
    async (remainingFiles: File[], index: number) => {
      if (index >= remainingFiles.length) {
        setIsUploading(false);
        setUploadProgress(100);
        return;
      }

      const file = remainingFiles[index];
      setCurrentFile(file);

      try {
        const status = await uploadFile(file);
        setUploadResults(prev => [...prev, { fileName: file.name, status }]);
      } catch (error) {
        console.error("Upload error:", error);
        setUploadResults(prev => [
          ...prev,
          { fileName: file.name, status: "failed" }
        ]);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}. ${error instanceof Error ? error.message : "Unknown error"}`,
          variant: "destructive"
        });
      }

      const progress = ((index + 1) / remainingFiles.length) * 100;
      setUploadProgress(progress);
      processNextFile(remainingFiles, index + 1);
    },
    [uploadFile]
  );

  const performUpload = async (formData: FormData) => {
    const uploadResponse = await fetch("/api/bulk-upload", {
      method: "POST",
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();
    console.log("Upload result:", result);
  };

  const [overwriteHandlers, setOverwriteHandlers] = useState<{
    handleConfirm: () => void;
    handleCancel: () => void;
  }>({ handleConfirm: () => {}, handleCancel: () => {} });

  const generatePDF = useCallback(async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    const itemsPerPage = 25; // Adjust this number as needed

    // Add logo
    const logoUrl = "/kdgs.png";
    const logoImage = await fetch(logoUrl).then(res => res.arrayBuffer());
    const logoImageEmbed = await pdfDoc.embedPng(logoImage);
    const logoDims = logoImageEmbed.scale(0.08);

    const addPage = () => {
      const page = pdfDoc.addPage();
      const { height, width } = page.getSize();

      // Draw logo
      page.drawImage(logoImageEmbed, {
        x: 50,
        y: height - logoDims.height - 50,
        width: logoDims.width,
        height: logoDims.height
      });

      // Add current date and time
      const currentDateTime = format(new Date(), "MMMM d, yyyy HH:mm:ss");
      page.drawText(currentDateTime, {
        x: width - 200,
        y: height - 4 * fontSize,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });

      // Add title
      page.drawText("Upload Results", {
        x: 50,
        y: height - logoDims.height - 80,
        size: 16,
        font: font,
        color: rgb(0, 0, 0)
      });

      return { page, startY: height - logoDims.height - 130 };
    };

    let { page, startY } = addPage();
    let currentY = startY;
    let pageIndex = 1;

    uploadResults.forEach((result, index) => {
      if (index > 0 && index % itemsPerPage === 0) {
        ({ page, startY } = addPage());
        currentY = startY;
        pageIndex++;
      }

      page.drawText(`${result.fileName} - ${result.status}`, {
        x: 50,
        y: currentY,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0)
      });

      currentY -= lineHeight;
    });

    // Add page numbers
    pdfDoc.getPages().forEach((page, index) => {
      const { width, height } = page.getSize();
      page.drawText(`Page ${index + 1} of ${pdfDoc.getPageCount()}`, {
        x: width - 100,
        y: 30,
        size: 10,
        font: font,
        color: rgb(0, 0, 0)
      });
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `upload_results_${format(new Date(), "yyyy-MM-dd_HHmmss")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [uploadResults]);

  return (
    <div className="space-y-4">
          <div className="space-y-4">
            <Input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hover:cursor-pointer"
            />
            <div className="flex space-x-2">
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Files"}
              </Button>
              {uploadResults.length > 0 && (
                <Button onClick={generatePDF} variant="outline">
                  Download Results PDF
                </Button>
              )}
            </div>
            {isUploading && (
              <Progress value={uploadProgress} className="w-full" />
            )}
            {uploadResults.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Upload Results:</h3>
                <ul className="list-disc pl-5">
                  {uploadResults.map((result, index) => (
                    <li
                      key={index}
                      className={`text-${result.status === "failed" ? "red" : "green"}-600`}
                    >
                      {result.fileName} - {result.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
      <OverwriteConfirmationDialog
        isOpen={overwriteDialogOpen}
        onConfirm={overwriteHandlers.handleConfirm}
        onCancel={overwriteHandlers.handleCancel}
        fileName={currentFile?.name || ""}
      />
    </div>
  );
}
