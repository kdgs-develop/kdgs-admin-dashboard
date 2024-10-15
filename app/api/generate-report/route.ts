import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const LETTER_WIDTH = 612; // 8.5 inches
const LETTER_HEIGHT = 792; // 11 inches
const MARGIN = 50;
const LINE_HEIGHT = 20;

export async function POST(request: Request) {
  const { reportType } = await request.json();

  if (reportType === 'unproofread') {
    const obituaries = await prisma.obituary.findMany({
      where: {
        proofread: false
      },
      orderBy: {
        reference: 'asc'
      }
    });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
    let currentY = LETTER_HEIGHT - MARGIN;

    // Helper function to add a new page
    const addNewPage = () => {
      page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
      currentY = LETTER_HEIGHT - MARGIN;
      return page;
    };

    // Helper function to check if we need a new page
    const checkNewPage = (lineCount: number) => {
      if (currentY - lineCount * LINE_HEIGHT < MARGIN) {
        return addNewPage();
      }
      return page;
    };

    // Add title
    page.drawText('Unproofread Obituaries Report', {
      x: MARGIN,
      y: currentY,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    currentY -= LINE_HEIGHT * 2;

    // Add table headers
    const headers = ['File Number', 'Surname', 'Given Names', 'Death Date', 'Proofread'];
    const columnWidths = [100, 100, 150, 100, 80];
    
    page = checkNewPage(2);
    headers.forEach((header, index) => {
      let x = MARGIN;
      for (let i = 0; i < index; i++) {
        x += columnWidths[i];
      }
      page.drawText(header, {
        x,
        y: currentY,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    });
    currentY -= LINE_HEIGHT * 1.5;

    // Add table rows
    obituaries.forEach((obituary) => {
      page = checkNewPage(2);
      
      const rowData = [
        obituary.reference,
        obituary.surname || '',
        obituary.givenNames || '',
        obituary.deathDate?.toLocaleDateString() || '',
        obituary.proofread ? 'Yes' : 'No'
      ];

      rowData.forEach((text, index) => {
        let x = MARGIN;
        for (let i = 0; i < index; i++) {
          x += columnWidths[i];
        }
        page.drawText(text, {
          x,
          y: currentY,
          size: 8,
          font,
          color: rgb(0, 0, 0),
        });
      });

      currentY -= LINE_HEIGHT;
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="unproofread_obituaries_report.pdf"',
      },
    });
  }

  return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
}
