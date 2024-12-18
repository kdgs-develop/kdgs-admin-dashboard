import { getObituaries } from '@/lib/db';
import { NextResponse } from 'next/server';
import { PDFDocument, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MARGIN = 50;
const RECORDS_PER_PAGE = 25;
const KDGS_LOGO_URL = 'https://kdgs-admin-dashboard.vercel.app/kdgs.png';

export async function POST(request: Request) {
  try {
    const { searchQuery, totalResults } = await request.json();

    const { obituaries } = await getObituaries(searchQuery, 0, Number(totalResults));

    if (!obituaries.length) {
      return NextResponse.json(
        { error: 'No obituaries found for the search query' },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Fetch and embed the KDGS logo
    const logoImageBytes = await fetch(KDGS_LOGO_URL).then((res) => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    const headers = ['#', 'File #', 'Surname', 'Given Names', 'Death Date', 'Proofread', 'Images'];
    const columnWidths = [30, 70, 100, 100, 80, 70, 50];
    const totalPages = Math.ceil(obituaries.length / RECORDS_PER_PAGE);

    // Function to add header to each page
    const addPageHeader = (page: PDFPage, pageNumber: number) => {
      const { width, height } = page.getSize();
      
      // Add title and search info
      page.drawText('KDGS Database - Search Results Report', {
        x: MARGIN,
        y: height - MARGIN,
        size: 14,
        font: boldFont
      });

      page.drawText(`Search Query: ${searchQuery}`, {
        x: MARGIN,
        y: height - MARGIN - 30,
        size: 12,
        font: boldFont
      });

      page.drawText(`Total Results: ${obituaries.length}`, {
        x: MARGIN,
        y: height - MARGIN - 45,
        size: 10,
        font: font
      });

      // Add page number
      page.drawText(`Page ${pageNumber} of ${totalPages}`, {
        x: MARGIN,
        y: height - MARGIN - 60,
        size: 10,
        font: font
      });

      // Draw KDGS logo
      page.drawImage(logoImage, {
        x: width - 150,
        y: height - 70,
        width: 100,
        height: 50
      });

      // Add table headers
      let xPos = MARGIN;
      headers.forEach((header, i) => {
        page.drawText(header, {
          x: xPos,
          y: height - MARGIN - 100,
          size: 10,
          font: boldFont
        });
        xPos += columnWidths[i];
      });

      return height - MARGIN - 120;
    };

    // Process records page by page
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
      let yPos = addPageHeader(page, pageNum + 1);

      const startIdx = pageNum * RECORDS_PER_PAGE;
      const endIdx = Math.min((pageNum + 1) * RECORDS_PER_PAGE, obituaries.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const obituary = obituaries[i];
        let xPos = MARGIN;

        const rowData = [
          (i + 1).toString(),
          obituary.reference || '',
          obituary.surname || '',
          obituary.givenNames || '',
          obituary.deathDate ? format(new Date(obituary.deathDate), 'yyyy-MM-dd') : '',
          obituary.proofread ? 'Yes' : 'No',
          obituary.images?.length?.toString() || '0'
        ];

        rowData.forEach((text, colIndex) => {
          page.drawText(String(text), {
            x: xPos,
            y: yPos,
            size: 9,
            font: font
          });
          xPos += columnWidths[colIndex];
        });

        yPos -= 20;
      }

      // Add footer
      const footerText = 'Compiled by © 2024 Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8';
      const copyrightText = 'Developed by Javier Gongora o/a Vyoniq Technologies';
      const generationDate = `Generated on ${format(new Date(), 'yyyy-MM-dd')}`;
      
      page.drawText(footerText, {
        x: MARGIN,
        y: MARGIN + 30,
        size: 8,
        font: font
      });

      page.drawText(generationDate, {
        x: MARGIN,
        y: MARGIN + 15,
        size: 8,
        font: font
      });

      page.drawText(copyrightText, {
        x: MARGIN,
        y: MARGIN,
        size: 8,
        font: font
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    return NextResponse.json({ pdf: pdfUrl });

  } catch (error) {
    console.error('Error generating search report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
}
