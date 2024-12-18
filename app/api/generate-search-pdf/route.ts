import { getObituariesSearchReport } from '@/lib/db';
import { format } from 'date-fns';
import { NextResponse } from 'next/server';
import { PDFDocument, PDFFont, PDFPage, StandardFonts } from 'pdf-lib';

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MARGIN = 50;
const RECORDS_PER_PAGE = 25;
const KDGS_LOGO_URL = 'https://kdgs-admin-dashboard.vercel.app/kdgs.png';

function truncateText(text: string, width: number, fontSize: number, pdfFont: PDFFont): string {
  if (!text) return '';
  let truncated = text;
  while (pdfFont.widthOfTextAtSize(truncated, fontSize) > width && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length < text.length ? truncated + '...' : truncated;
}

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { searchQuery } = await request.json();

    const { obituaries, totalObituaries } = await getObituariesSearchReport(
      searchQuery,
      0,
      0
    );

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
    const logoImageBytes = await fetch(KDGS_LOGO_URL).then((res) =>
      res.arrayBuffer()
    );
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    const headers = [
      '#',
      'File #',
      'Surname',
      'Given Names',
      'Death Date',
      'Proofread',
      'Images'
    ];
    const columnWidths = [30, 70, 100, 100, 80, 70, 50];
    const totalPages = Math.ceil(totalObituaries / RECORDS_PER_PAGE);

    // Function to add header to each page
    const addPageHeader = (page: PDFPage, pageNumber: number) => {
      const { width, height } = page.getSize();

      // Add title
      page.drawText('KDGS Database - Search Results Report', {
        x: MARGIN,
        y: height - MARGIN,
        size: 14,
        font: boldFont
      });

      // Add search query
      page.drawText(`Search Query: ${searchQuery}`, {
        x: MARGIN,
        y: height - MARGIN - 30,
        size: 12,
        font: boldFont
      });

      // Add total results
      page.drawText(`Total Results: ${totalObituaries}`, {
        x: MARGIN,
        y: height - MARGIN - 50,
        size: 10,
        font: font
      });

      // Add date time
      const currentDateTime = new Date().toLocaleString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      page.drawText(`Generated: ${currentDateTime}`, {
        x: MARGIN,
        y: height - MARGIN - 70,
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
      const endIdx = Math.min(
        (pageNum + 1) * RECORDS_PER_PAGE,
        totalObituaries
      );

      for (let i = startIdx; i < endIdx; i++) {
        const obituary = obituaries[i];
        let xPos = MARGIN;

        const rowData = [
          (i + 1).toString(),
          obituary.reference || '',
          truncateText(obituary.surname || '', columnWidths[2] - 5, 9, font),
          truncateText(obituary.givenNames || '', columnWidths[3] - 5, 9, font),
          obituary.deathDate
            ? format(new Date(obituary.deathDate), 'yyyy-MM-dd')
            : '',
          obituary.proofread ? 'Yes' : 'No',
          ''  // Empty string for images column
        ];

        // Draw the row data
        rowData.forEach((text, colIndex) => {
          page.drawText(String(text), {
            x: xPos,
            y: yPos,
            size: 9,
            font: font
          });
          xPos += columnWidths[colIndex];
        });

        // Handle images column separately
        const imageXPos = xPos - columnWidths[6]; // Position for images column
        if (!obituary.images?.length) {
          page.drawText('None', {
            x: imageXPos,
            y: yPos,
            size: 9,
            font: font
          });
        } else if (obituary.images?.length === 1) {
          page.drawText(obituary.images[0].name, {
            x: imageXPos,
            y: yPos,
            size: 9,
            font: font
          });
        } else {
          // If multiple images, show all in smaller font vertically
          obituary.images?.forEach((image, index) => {
            page.drawText(image?.name, {
              x: imageXPos,
              y: yPos - (index * 10),
              size: 7,
              font: font
            });
          });
          // Adjust yPos for multiple images
          yPos -= (obituary.images?.length - 1) * 10;
        }

        yPos -= 20;
      }

      // Add footer
      const footerText =
        'Compiled by © 2024 Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8';
      const copyrightText =
        'Developed by Javier Gongora o/a Vyoniq Technologies';
      const pageInfo = `Page ${pageNum + 1} of ${totalPages}`;

      // Draw footer text on the left
      page.drawText(footerText, {
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

      // Draw page info on the right
      const pageWidth = page.getWidth();
      const pageInfoWidth = font.widthOfTextAtSize(pageInfo, 8);
      page.drawText(pageInfo, {
        x: pageWidth - MARGIN - pageInfoWidth,
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
      {
        error:
          error instanceof Error ? error.message : 'Failed to generate report'
      },
      { status: 500 }
    );
  }
}
