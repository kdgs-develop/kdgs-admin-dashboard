import { getObituaries, Obituary } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

// A4 page dimensions in points (pt)
const A4_PAGE = {
  width: 595.28,
  height: 841.89
};

// Table configuration
const TABLE_CONFIG = {
  startY: 680,
  margin: 50,
  rowHeight: 21,
  columns: [
    { width: 30, title: '#' },
    { width: 70, title: 'File #' },
    { width: 100, title: 'Surname' },
    { width: 100, title: 'Given Names' },
    { width: 80, title: 'Death Date' },
    { width: 70, title: 'Proofread' },
    { width: 50, title: 'Images' }
  ]
};

// Update footer configuration
const FOOTER_CONFIG = {
  text: 'Compiled by © 2024 Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8\nDeveloped by Javier Gongora o/a Vyoniq Technologies',
  fontSize: 8,
  y: 20,
  lineSpacing: 2
};

// Add truncate helper
function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, totalResults } = await req.json();
    console.log('Received request:', { searchQuery, totalResults });

    // Get all results for the PDF (no pagination)
    const { obituaries } = await getObituaries(searchQuery, 0, Number(totalResults));
    console.log(`Found ${obituaries.length} obituaries`);

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Load and embed the KDGS logo
    const logoPath = path.join(process.cwd(), 'public', 'kdgs.png');
    const logoBytes = await fs.readFile(logoPath);
    const logoImage = await pdfDoc.embedPng(logoBytes);
    const logoSize = { width: 100, height: 50 }; // Adjust size as needed

    // Create first page
    let currentPage = pdfDoc.addPage([A4_PAGE.width, A4_PAGE.height]);
    let pageNumber = 1;
    const totalPages = Math.ceil(obituaries.length / 25); // Approximately 25 rows per page

    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Function to add header and footer to each page
    const addPageHeader = (page: typeof currentPage) => {
      // Add logo
      page.drawImage(logoImage, {
        x: A4_PAGE.width - logoSize.width - TABLE_CONFIG.margin,
        y: A4_PAGE.height - logoSize.height - 30,
        width: logoSize.width,
        height: logoSize.height
      });

      // Add title and search info on every page
      page.drawText('KDGS Database - Search Results Report', {
        x: TABLE_CONFIG.margin,
        y: A4_PAGE.height - 50,
        size: 14,
        font: boldFont
      });

      page.drawText(`Search Query: ${searchQuery}`, {
        x: TABLE_CONFIG.margin,
        y: A4_PAGE.height - 80,
        size: 12,
        font: boldFont
      });

      page.drawText(`Total Results: ${obituaries.length}`, {
        x: TABLE_CONFIG.margin,
        y: A4_PAGE.height - 95,
        size: 10,
        font
      });

      page.drawText(`Generated: ${new Date().toLocaleString()}`, {
        x: TABLE_CONFIG.margin,
        y: A4_PAGE.height - 110,
        size: 10,
        font
      });

      // Draw table header
      let x = TABLE_CONFIG.margin;
      const headerY = TABLE_CONFIG.startY;
      
      TABLE_CONFIG.columns.forEach(column => {
        page.drawText(column.title, {
          x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        x += column.width;
      });

      // Draw header line
      page.drawLine({
        start: { x: TABLE_CONFIG.margin, y: headerY - 5 },
        end: { x: A4_PAGE.width - TABLE_CONFIG.margin, y: headerY - 5 },
        thickness: 1,
        color: rgb(0, 0, 0)
      });

      // Add footer and page number
      const footerLines = FOOTER_CONFIG.text.split('\n');
      const totalFooterHeight = footerLines.length * (FOOTER_CONFIG.fontSize + FOOTER_CONFIG.lineSpacing);
      
      // Calculate page number text width for right alignment
      const pageNumberText = `Page ${pageNumber} of ${totalPages}`;
      const pageNumberWidth = font.widthOfTextAtSize(pageNumberText, FOOTER_CONFIG.fontSize);
      
      // Draw page number aligned with right margin
      page.drawText(pageNumberText, {
        x: A4_PAGE.width - TABLE_CONFIG.margin - pageNumberWidth, // Align with right margin
        y: FOOTER_CONFIG.y,
        size: FOOTER_CONFIG.fontSize,
        font
      });

      // Draw footer lines from bottom up
      footerLines.reverse().forEach((line, index) => {
        page.drawText(line, {
          x: TABLE_CONFIG.margin,
          y: FOOTER_CONFIG.y + (index * (FOOTER_CONFIG.fontSize + FOOTER_CONFIG.lineSpacing)),
          size: FOOTER_CONFIG.fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4)
        });
      });
    };

    // Add header to first page
    addPageHeader(currentPage);

    // Draw table rows
    let y = TABLE_CONFIG.startY - TABLE_CONFIG.rowHeight;
    
    for (let i = 0; i < obituaries.length; i++) {
      const obituary: Obituary = obituaries[i];
      console.log(obituary.fileImages);

      // Check if we need a new page
      if (y < 140) { // Increased from 120 to 140 to force new page after 25 entries
        pageNumber++;
        currentPage = pdfDoc.addPage([A4_PAGE.width, A4_PAGE.height]);
        addPageHeader(currentPage);
        y = TABLE_CONFIG.startY - TABLE_CONFIG.rowHeight;
      }

      // Draw row data
      let x = TABLE_CONFIG.margin;
      
      // Index
      currentPage.drawText(`${i + 1}`, {
        x,
        y,
        size: 10,
        font
      });
      x += TABLE_CONFIG.columns[0].width;

      // File Number
      currentPage.drawText(obituary.reference || '', {
        x,
        y,
        size: 10,
        font
      });
      x += TABLE_CONFIG.columns[1].width;

      // Surname
      currentPage.drawText(truncateText(obituary.surname, 12), {
        x,
        y,
        size: 10,
        font
      });
      x += TABLE_CONFIG.columns[2].width;

      // Given Names
      currentPage.drawText(obituary.givenNames || '', {
        x,
        y,
        size: 10,
        font
      });
      x += TABLE_CONFIG.columns[3].width;

      // Death Date
      currentPage.drawText(
        obituary.deathDate
          ? new Date(obituary.deathDate).toLocaleDateString()
          : '',
        {
          x,
          y,
          size: 10,
          font
        }
      );
      x += TABLE_CONFIG.columns[4].width;

      // Proofread
      currentPage.drawText(obituary.proofread ? 'Yes' : 'No', {
        x,
        y,
        size: 10,
        font
      });
      x += TABLE_CONFIG.columns[5].width;
      // Images Count
      currentPage.drawText(obituary.fileImages?.length?.toString() || '0', {
        x,
        y,
        size: 10,
        font
      });

      y -= TABLE_CONFIG.rowHeight;
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="search_results_${Date.now()}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 