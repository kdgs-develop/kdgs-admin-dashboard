import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { fetchImagesForObituaryAction } from '../(dashboard)/obituary/[reference]/actions';
import minioClient from '@/lib/minio-client';

const LETTER_WIDTH = 612; // 8.5 inches
const LETTER_HEIGHT = 792; // 11 inches
const MARGIN = 50;
const LINE_HEIGHT = 20;
const KDGS_LOGO_URL = 'https://kdgs-admin-dashboard.vercel.app/kdgs.png';

async function generateObituariesReport(proofread: boolean) {
  const obituaries = await prisma.obituary.findMany({
    where: { proofread },
    orderBy: { reference: 'asc' },
  });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logoImageBytes = await fetch(KDGS_LOGO_URL).then((res) => res.arrayBuffer());
  const logoImage = await pdfDoc.embedPng(logoImageBytes);

  const totalPages = Math.ceil(obituaries.length / 25) + 1; // +1 for the title page

  const addPageWithHeaderAndFooter = (pageNumber: number) => {
    const page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
    const { width, height } = page.getSize();
    const currentDate = format(new Date(), 'dd/MM/yyyy');

    // Add KDGS logo to the header
    page.drawImage(logoImage, {
      x: width - 100,
      y: height - 60,
      width: 50,
      height: 25,
    });

    // Add current date to the footer
    page.drawText(currentDate, {
      x: MARGIN,
      y: 30,
      size: 10,
      font: font,
    });

    // Add page number to the footer
    page.drawText(`Page ${pageNumber} of ${totalPages}`, {
      x: width - 150,
      y: 30,
      size: 10,
      font: font,
    });

    // Add copyright info to the footer
    const copyrightInfo = 'Compiled by Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8';
    const copyrightYear = '© 2024 Javier Gongora';
    page.drawText(copyrightInfo, {
      x: MARGIN,
      y: 15,
      size: 6,
      font: font,
    });
    page.drawText(copyrightYear, {
      x: MARGIN,
      y: 7,
      size: 6,
      font: font,
    });

    return page;
  };

  const drawTableHeaders = (page: PDFPage, y: number) => {
    const headers = ['File Number', 'Surname', 'Given Names', 'Death Date', 'Proofread'];
    const columnWidths = [100, 100, 150, 100, 80];
    
    headers.forEach((header, index) => {
      let x = MARGIN;
      for (let i = 0; i < index; i++) {
        x += columnWidths[i];
      }
      page.drawText(header, {
        x,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
    });

    return columnWidths;
  };

  // Title page
  let page = addPageWithHeaderAndFooter(1);
  let currentY = LETTER_HEIGHT - MARGIN - 60; // Start below the header and logo

  // Add title and total obituaries
  const reportTitle = proofread ? 'Proofread Obituaries Report' : 'Unproofread Obituaries Report';
  page.drawText(reportTitle, {
    x: MARGIN,
    y: currentY,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  currentY -= LINE_HEIGHT * 2;

  page.drawText(`Total ${proofread ? 'Proofread' : 'Unproofread'} Obituaries: ${obituaries.length}`, {
    x: MARGIN,
    y: currentY,
    size: 12,
    font: font,
    color: rgb(0, 0, 0),
  });
  currentY -= LINE_HEIGHT * 3;

  // Add table headers
  const columnWidths = drawTableHeaders(page, currentY);
  currentY -= LINE_HEIGHT * 1.5;

  // Add table rows
  obituaries.forEach((obituary, index) => {
    if (index % 25 === 0 && index !== 0) {
      page = addPageWithHeaderAndFooter(Math.floor(index / 25) + 2);
      currentY = LETTER_HEIGHT - MARGIN - 60;
      drawTableHeaders(page, currentY);
      currentY -= LINE_HEIGHT * 1.5;
    }

    const rowData = [
      obituary.reference,
      obituary.surname || '',
      obituary.givenNames || '',
      obituary.deathDate?.toLocaleDateString() || '',
      obituary.proofread ? 'Yes' : 'No'
    ];

    rowData.forEach((text, colIndex) => {
      let x = MARGIN;
      for (let i = 0; i < colIndex; i++) {
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

  return pdfDoc.save();
}

export async function POST(request: Request) {
  const { reportType } = await request.json();

  if (reportType === 'unproofread' || reportType === 'proofread') {
    try {
      const pdfBytes = await generateObituariesReport(reportType === 'proofread');
      
      // Get obituaries to fetch their images
      const obituaries = await prisma.obituary.findMany({
        where: { proofread: reportType === 'proofread' },
        orderBy: { reference: 'asc' },
      });

      // Get all images for these obituaries
      const imagePromises = obituaries.map(obituary => 
        fetchImagesForObituaryAction(obituary.reference)
      );
      const imageArrays = await Promise.all(imagePromises);
      const allImages = imageArrays.flat();

      // Convert PDF to base64
      const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
      const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

      // Get presigned URLs for all images
      const imageUrls = await Promise.all(
        allImages.map(async (imageName: string) => {
          const url = await minioClient.presignedGetObject(
            process.env.MINIO_BUCKET_NAME!,
            imageName,
            60 * 60 // URL valid for 1 hour
          );
          return url;
        })
      );

      return NextResponse.json({
        pdf: pdfUrl,
        images: imageUrls
      });
    } catch (error) {
      console.error('Error generating report:', error);
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
}
