import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { format } from 'date-fns';

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MARGIN = 50;
const RECORDS_PER_PAGE = 25;
const KDGS_LOGO_URL = 'https://kdgs-admin-dashboard.vercel.app/kdgs.png';

export async function POST(request: Request) {
  try {
    // Get all file boxes with their obituaries
    const fileBoxes = await prisma.fileBox.findMany({
      include: {
        obituaries: {
          orderBy: { reference: 'asc' },
          select: {
            reference: true,
            surname: true,
            givenNames: true,
            maidenName: true,
            birthDate: true,
            deathDate: true,
            proofread: true,
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { number: 'asc' }
      ]
    });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Fetch and embed the KDGS logo
    const logoImageBytes = await fetch(KDGS_LOGO_URL).then((res) => res.arrayBuffer());
    const logoImage = await pdfDoc.embedPng(logoImageBytes);

    const headers = ['File Number', 'Surname', 'Given Names', 'Maiden Name', 'Birth Date', 'Death Date', 'Proofread'];
    const columnWidths = [80, 80, 100, 80, 80, 80, 60];

    // Function to add header to each page
    const addPageHeader = (page: PDFPage, fileBox: any) => {
      const { width, height } = page.getSize();
      
      // Add title
      const title = `File Box Report - ${fileBox.year} : ${fileBox.number}`;
      page.drawText(title, {
        x: MARGIN,
        y: height - MARGIN,
        size: 16,
        font: boldFont,
      });

      // Draw KDGS logo on the right
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
          y: height - MARGIN - 80,
          size: 10,
          font: boldFont,
        });
        xPos += columnWidths[i];
      });

      return height - MARGIN - 100;
    };

    // Process each file box
    for (const fileBox of fileBoxes) {
      if (fileBox.obituaries.length === 0) continue;

      const totalPages = Math.ceil(fileBox.obituaries.length / RECORDS_PER_PAGE);
      
      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        const page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
        let yPos = addPageHeader(page, fileBox);

        const startIdx = pageNum * RECORDS_PER_PAGE;
        const endIdx = Math.min((pageNum + 1) * RECORDS_PER_PAGE, fileBox.obituaries.length);
        
        for (let i = startIdx; i < endIdx; i++) {
          const obituary = fileBox.obituaries[i];
          let xPos = MARGIN;

          const rowData = [
            obituary.reference,
            obituary.surname || '',
            obituary.givenNames || '',
            obituary.maidenName || '',
            obituary.birthDate ? format(new Date(obituary.birthDate), 'yyyy-MM-dd') : '',
            obituary.deathDate ? format(new Date(obituary.deathDate), 'yyyy-MM-dd') : '',
            obituary.proofread ? 'Yes' : 'No'
          ];

          rowData.forEach((text, colIndex) => {
            page.drawText(String(text), {
              x: xPos,
              y: yPos,
              size: 9,
              font: font,
            });
            xPos += columnWidths[colIndex];
          });

          yPos -= 20;
        }

        // Add footer
        const footerText = 'Compiled by Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8';
        const copyrightText = '© 2024 Kelowna & District Genealogical Society | Developed by Javier Gongora o/a Vyoniq Technologies';
        const generationDate = `Generated on ${format(new Date(), 'yyyy-MM-dd')}`;
        
        page.drawText(footerText, {
          x: MARGIN,
          y: MARGIN + 30,
          size: 8,
          font: font,
        });

        page.drawText(generationDate, {
          x: MARGIN,
          y: MARGIN + 15,
          size: 8,
          font: font,
        });

        page.drawText(copyrightText, {
          x: MARGIN,
          y: MARGIN,
          size: 8,
          font: font,
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    return NextResponse.json({ pdf: pdfUrl });

  } catch (error) {
    console.error('Error generating file box report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate report' },
      { status: 500 }
    );
  }
} 