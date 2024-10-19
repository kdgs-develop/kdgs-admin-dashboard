import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateBulkUploadReport(results: { fileName: string; status: 'success' | 'failed' | 'skipped' }[]): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Define colors
  const modernBlue = rgb(0.1, 0.4, 0.7);
  const black = rgb(0, 0, 0);

  // Helper function to draw text
  const drawText = (
    text: string,
    x: number,
    y: number,
    size: number,
    isBold = false,
    color = black
  ) => {
    page.drawText(text, {
      x,
      y: height - y,
      size,
      font: isBold ? boldFont : font,
      color: color
    });
  };

  // Helper function to draw a line
  const drawLine = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color = black
  ) => {
    page.drawLine({
      start: { x: startX, y: height - startY },
      end: { x: endX, y: height - endY },
      thickness: 1,
      color: color
    });
  };

  // Header
  drawText('Bulk Upload Results', 50, 50, 20, true, modernBlue);
  drawLine(50, 70, width - 50, 70, modernBlue);

  // Results
  let currentY = 100;
  results.forEach((result, index) => {
    const statusColor = result.status === 'success' ? rgb(0, 0.5, 0) : result.status === 'failed' ? rgb(0.8, 0, 0) : rgb(0.5, 0.5, 0);
    drawText(`${index + 1}. ${result.fileName}:`, 50, currentY, 12, true);
    drawText(result.status, 300, currentY, 12, false, statusColor);
    currentY += 20;
  });

  // Footer
  const footerText = 'Compiled by Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8';
  const copyrightText = '© 2024 Javier Gongora';
  drawText(footerText, 50, height - 30, 8);
  drawText(copyrightText, 50, height - 15, 8);

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}