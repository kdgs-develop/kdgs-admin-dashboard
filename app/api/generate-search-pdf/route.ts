import { getObituariesGeneratePDF } from '@/lib/db';
import minioClient from '@/lib/minio-client';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MARGIN = 50;
const RECORDS_PER_PAGE = 25;
const LINE_HEIGHT = 12;
const KDGS_LOGO_URL = 'https://kdgs-admin-dashboard.vercel.app/kdgs.png';
const MAX_SURNAME_LENGTH = 15;
const MAX_GIVEN_NAMES_LENGTH = 15;

// Define column widths and positions
const COLUMNS = {
  number: { width: 30, x: MARGIN },
  reference: { width: 70, x: MARGIN + 30 },
  surname: { width: 100, x: MARGIN + 100 },
  givenNames: { width: 100, x: MARGIN + 200 },
  deathDate: { width: 80, x: MARGIN + 300 },
  proofread: { width: 70, x: MARGIN + 380 },
  images: { width: 80, x: MARGIN + 450 }
};

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { obituaries } = await getObituariesGeneratePDF(searchQuery);

    if (!obituaries.length) {
      return NextResponse.json({ error: 'No results found' }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Fetch and embed the KDGS logo
    const logoImageBytes = await fetch(KDGS_LOGO_URL).then((res) =>
      res.arrayBuffer()
    );
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    const totalPages = Math.ceil(obituaries.length / RECORDS_PER_PAGE);

    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
      const { width, height } = page.getSize();

      // Draw page header
      const addPageHeader = (page: PDFPage, pageNumber: number) => {
        const { width, height } = page.getSize();

        // Add title
        const title = 'Search Results Report';
        page.drawText(title, {
          x: MARGIN,
          y: height - MARGIN,
          size: 16,
          font: boldFont
        });

        // Add search query info in bold and bigger
        page.drawText(`Search Query: ${searchQuery}`, {
          x: MARGIN,
          y: height - MARGIN - 25,
          size: 12,
          font: boldFont
        });

        // Add total results in bold and bigger
        page.drawText(`Total Results: ${obituaries.length}`, {
          x: MARGIN,
          y: height - MARGIN - 45,
          size: 12,
          font: boldFont
        });

        // Add page number
        page.drawText(`Page ${pageNumber} of ${totalPages}`, {
          x: MARGIN,
          y: height - MARGIN - 65,
          size: 10,
          font: font
        });

        // Draw KDGS logo on the right (adjusted position)
        page.drawImage(logoImage, {
          x: width - 150,
          y: height - 90,
          width: 100,
          height: 50
        });

        // Add table headers (adjusted position)
        const headerY = height - MARGIN - 100;
        page.drawText('#', {
          x: COLUMNS.number.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText('File #', {
          x: COLUMNS.reference.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText('Surname', {
          x: COLUMNS.surname.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText('Given Names', {
          x: COLUMNS.givenNames.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText('Death Date', {
          x: COLUMNS.deathDate.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText('Proofread', {
          x: COLUMNS.proofread.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText('Images', {
          x: COLUMNS.images.x,
          y: headerY,
          size: 10,
          font: boldFont
        });

        return height - MARGIN - 120; // Adjusted starting Y position for data
      };

      const headerY = addPageHeader(page, pageNum + 1);

      let yPos = headerY;
      const startIdx = pageNum * RECORDS_PER_PAGE;
      const endIdx = Math.min(
        (pageNum + 1) * RECORDS_PER_PAGE,
        obituaries.length
      );

      for (let i = startIdx; i < endIdx; i++) {
        const obituary = obituaries[i];
        const imageCount = obituary.imageNames?.length || 0;
        const rowHeight = Math.max(
          LINE_HEIGHT,
          imageCount > 0 ? imageCount * LINE_HEIGHT : LINE_HEIGHT
        );
        const rowCenter = yPos - rowHeight / 2 + LINE_HEIGHT / 2;

        // Draw row data with truncation
        page.drawText((i + 1).toString(), {
          x: COLUMNS.number.x,
          y: rowCenter,
          size: 9,
          font: font
        });

        page.drawText(obituary.reference || '', {
          x: COLUMNS.reference.x,
          y: rowCenter,
          size: 9,
          font: font
        });

        page.drawText(
          obituary.surname?.[12]
            ? `${(obituary.surname || '').slice(0, 12)}...`
            : (obituary.surname || '').slice(0, 12),
          {
            x: COLUMNS.surname.x,
            y: rowCenter,
            size: 9,
            font: font
          }
        );

        page.drawText(
          obituary.givenNames?.[15]
            ? `${(obituary.givenNames || '').slice(0, 15)}...`
            : (obituary.givenNames || '').slice(0, 15),
          {
            x: COLUMNS.givenNames.x,
            y: rowCenter,
            size: 9,
            font: font
          }
        );

        if (obituary.deathDate) {
          page.drawText(format(new Date(obituary.deathDate), 'yyyy-MM-dd'), {
            x: COLUMNS.deathDate.x,
            y: rowCenter,
            size: 9,
            font: font
          });
        }

        page.drawText(obituary.proofread ? 'Yes' : 'No', {
          x: COLUMNS.proofread.x,
          y: rowCenter,
          size: 9,
          font: font
        });

        // Draw image names
        if (imageCount > 0) {
          if (obituary.imageNames![0]) {
            page.drawText(obituary.imageNames![0].slice(0, 15), {
              x: COLUMNS.images.x,
              y: yPos,
              size: 8,
              font: font,
              color: rgb(0.4, 0.4, 0.4)
            });
          }

          if (obituary.imageNames![1]) {
            page.drawText(obituary.imageNames![1].slice(0, 15), {
              x: COLUMNS.images.x,
              y: yPos - LINE_HEIGHT,
              size: 8,
              font: font,
              color: rgb(0.4, 0.4, 0.4)
            });
          }

          if (obituary.imageNames![2]) {
            page.drawText(obituary.imageNames![2].slice(0, 15), {
              x: COLUMNS.images.x,
              y: yPos - LINE_HEIGHT * 2,
              size: 8,
              font: font,
              color: rgb(0.4, 0.4, 0.4)
            });
          }
        }

        yPos -= rowHeight + 8;
      }

      // Add footer
      const footerText =
        'Compiled by © 2024 Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8';
      const copyrightText =
        'Developed by Javier Gongora o/a Vyoniq Technologies';

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
    }

    const pdfBytes = await pdfDoc.save();

    // Save to MinIO first
    const sanitizedQuery = searchQuery.replace(/@/g, '').replace(/\s+/g, '-');
    const fileName = `kdgs-report-${sanitizedQuery}-${Date.now()}.pdf`;
    const bucketName = process.env.MINIO_BUCKET_NAME!;

    try {
      await minioClient.putObject(
        bucketName,
        `reports/${fileName}`, // Note the 'reports/' prefix
        Buffer.from(pdfBytes)
      );
    } catch (error) {
      console.error('Error saving PDF to MinIO:', error);
      throw new Error('Failed to save report');
    }

    // Convert to base64 for immediate download
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Save report record to database
    const genealogist = await prisma.genealogist.findUnique({
      where: { clerkId: userId }
    });

    if (!genealogist) {
      throw new Error('Genealogist not found');
    }

    await prisma.report.create({
      data: {
        fileName,
        searchQuery,
        userId,
        role: genealogist.role || '',
        totalResults: obituaries.length
      }
    });

    // Return the PDF data URL
    return NextResponse.json({ pdf: pdfUrl });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
