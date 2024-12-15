import { getObituaries } from '@/lib/db';
import fs from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Cache static resources
let cachedFont: any = null;
let cachedBoldFont: any = null;
let cachedLogo: any = null;

const RECORDS_PER_PAGE = 25;
const A4_PAGE = { width: 595.28, height: 841.89 };
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

const FOOTER_CONFIG = {
  text: 'Compiled by © 2024 Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8\nDeveloped by Javier Gongora o/a Vyoniq Technologies',
  fontSize: 8,
  y: 20,
  lineSpacing: 2
};

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, totalResults } = await req.json();

    // Use existing getObituaries function
    const { obituaries } = await getObituaries(
      searchQuery,
      0,
      Number(totalResults)
    );

    const pdfDoc = await PDFDocument.create();

    // Load and cache fonts and logo only once
    if (!cachedFont || !cachedBoldFont || !cachedLogo) {
      [cachedFont, cachedBoldFont] = await Promise.all([
        pdfDoc.embedFont(StandardFonts.Helvetica),
        pdfDoc.embedFont(StandardFonts.HelveticaBold)
      ]);

      const logoPath = path.join(process.cwd(), 'public', 'kdgs.png');
      const logoBytes = await fs.readFile(logoPath);
      cachedLogo = await pdfDoc.embedPng(logoBytes);
    }

    const totalPages = Math.ceil(obituaries.length / RECORDS_PER_PAGE);
    const logoSize = { width: 100, height: 50 };

    // Process all pages concurrently
    await Promise.all(
      Array.from({ length: totalPages }).map(async (_, pageNum) => {
        const page = pdfDoc.addPage([A4_PAGE.width, A4_PAGE.height]);
        const pageNumber = pageNum + 1;

        // Add logo only on the first page
        if (pageNum === 0) {
          page.drawImage(cachedLogo, {
            x: A4_PAGE.width - logoSize.width - TABLE_CONFIG.margin,
            y: A4_PAGE.height - logoSize.height - 30,
            width: logoSize.width,
            height: logoSize.height
          });
        }

        // Draw all header text in one batch
        const headerTexts = [
          {
            text: 'KDGS Database - Search Results Report',
            size: 14,
            y: A4_PAGE.height - 50,
            font: cachedBoldFont
          },
          {
            text: `Search Query: ${searchQuery}`,
            size: 12,
            y: A4_PAGE.height - 80,
            font: cachedBoldFont
          },
          {
            text: `Total Results: ${obituaries.length}`,
            size: 10,
            y: A4_PAGE.height - 95,
            font: cachedFont
          },
          {
            text: `Generated: ${new Date().toLocaleString()}`,
            size: 10,
            y: A4_PAGE.height - 110,
            font: cachedFont
          }
        ];

        headerTexts.forEach(({ text, size, y, font }) => {
          page.drawText(text, {
            x: TABLE_CONFIG.margin,
            y,
            size,
            font
          });
        });

        // Draw table header in one batch
        let x = TABLE_CONFIG.margin;
        TABLE_CONFIG.columns.forEach((column) => {
          page.drawText(column.title, {
            x,
            y: TABLE_CONFIG.startY,
            size: 10,
            font: cachedBoldFont
          });
          x += column.width;
        });

        // Draw header line
        page.drawLine({
          start: { x: TABLE_CONFIG.margin, y: TABLE_CONFIG.startY - 5 },
          end: {
            x: A4_PAGE.width - TABLE_CONFIG.margin,
            y: TABLE_CONFIG.startY - 5
          },
          thickness: 1,
          color: rgb(0, 0, 0)
        });

        // Process batch of records for current page
        const startIdx = pageNum * RECORDS_PER_PAGE;
        const endIdx = Math.min(
          (pageNum + 1) * RECORDS_PER_PAGE,
          obituaries.length
        );
        let yPos = TABLE_CONFIG.startY - TABLE_CONFIG.rowHeight;

        // Draw all rows for current page in one batch
        for (let i = startIdx; i < endIdx; i++) {
          const obituary = obituaries[i];
          x = TABLE_CONFIG.margin;

          const rowData = [
            (i + 1).toString(),
            obituary.reference || '',
            truncateText(obituary.surname, 12),
            truncateText(obituary.givenNames, 19),
            obituary.deathDate
              ? new Date(obituary.deathDate).toLocaleDateString()
              : '',
            obituary.proofread ? 'Yes' : 'No',
            obituary.images?.length?.toString() || '0'
          ];

          rowData.forEach((text, colIndex) => {
            page.drawText(text, {
              x,
              y: yPos,
              size: 10,
              font: cachedFont
            });
            x += TABLE_CONFIG.columns[colIndex].width;
          });

          yPos -= TABLE_CONFIG.rowHeight;
        }

        // Add footer and page number
        const footerLines = FOOTER_CONFIG.text.split('\n');
        const pageNumberText = `Page ${pageNumber} of ${totalPages}`;
        const pageNumberWidth = cachedFont.widthOfTextAtSize(
          pageNumberText,
          FOOTER_CONFIG.fontSize
        );

        page.drawText(pageNumberText, {
          x: A4_PAGE.width - TABLE_CONFIG.margin - pageNumberWidth,
          y: FOOTER_CONFIG.y,
          size: FOOTER_CONFIG.fontSize,
          font: cachedFont
        });

        footerLines.forEach((line, index) => {
          page.drawText(line, {
            x: TABLE_CONFIG.margin,
            y:
              FOOTER_CONFIG.y +
              index * (FOOTER_CONFIG.fontSize + FOOTER_CONFIG.lineSpacing),
            size: FOOTER_CONFIG.fontSize,
            font: cachedFont,
            color: rgb(0.4, 0.4, 0.4)
          });
        });
      })
    );

    const pdfBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false
    });

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

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}
