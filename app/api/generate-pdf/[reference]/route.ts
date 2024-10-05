import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(
  request: Request,
  { params }: { params: { reference: string } }
) {
  try {
    const { reference } = params;
    const obituary = await prisma.obituary.findUnique({
      where: { reference },
      include: {
        title: true,
        birthCity: { include: { country: true } },
        deathCity: { include: { country: true } },
        cemetery: true,
        periodical: true,
        fileBox: true,
        relatives: true,
        alsoKnownAs: true
      }
    });

    if (!obituary) {
      return NextResponse.json(
        { error: 'Obituary not found' },
        { status: 404 }
      );
    }

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
    drawText('Obituary Index Report', 50, 50, 20, true, modernBlue);
    drawText('File Number:', 50, 75, 10, true);
    drawText(obituary.reference, 120, 75, 10);

    const fullName =
      `${obituary.title?.name || ''} ${obituary.givenNames || ''} ${obituary.surname || ''}`.trim();
    drawText('Full Name:', 50, 90, 10, true);
    drawText(fullName, 120, 90, 10);

    drawLine(50, 100, width - 50, 100, modernBlue);

    // Draw KDGS logo
    const logoUrl = 'https://kdgs-admin-dashboard.vercel.app/kdgs.png'; // Replace with the actual URL of your logo
    const logoImageBytes = await fetch(logoUrl).then((res) =>
      res.arrayBuffer()
    );
    const logoImage = await pdfDoc.embedPng(logoImageBytes);
    page.drawImage(logoImage, {
      x: width - 150,
      y: height - 70,
      width: 100,
      height: 50
    });
    // Section headers
    const drawSectionHeader = (text: string, y: number) => {
      drawText(text, 50, y, 14, true, modernBlue);
      drawLine(50, y + 5, width - 50, y + 5, modernBlue);
    };

    // Helper function to draw key-value pairs
    const drawKeyValuePair = (key: string, value: string, y: number) => {
      drawText(`${key}:`, 50, y, 10, true);
      drawText(value, 150, y, 10);
    };

    let currentY = 130;

    // Personal Information
    drawSectionHeader('Personal Information', currentY);
    currentY += 25;
    drawKeyValuePair('Title', obituary.title?.name || 'N/A', currentY);
    currentY += 15;
    drawKeyValuePair('Given Names', obituary.givenNames || 'N/A', currentY);
    currentY += 15;
    drawKeyValuePair('Surname', obituary.surname || 'N/A', currentY);
    currentY += 15;
    drawKeyValuePair('Maiden Name', obituary.maidenName || 'N/A', currentY);
    currentY += 15;
    drawKeyValuePair(
      'Birth Date',
      obituary.birthDate?.toDateString() || 'N/A',
      currentY
    );
    currentY += 15;
    drawKeyValuePair(
      'Death Date',
      obituary.deathDate?.toDateString() || 'N/A',
      currentY
    );
    currentY += 15;
    drawKeyValuePair('Place of Death', obituary.place || 'N/A', currentY);
    currentY += 25;

    // Also Known As
    drawSectionHeader('Also Known As', currentY);
    currentY += 25;
    if (obituary.alsoKnownAs.length > 0) {
      obituary.alsoKnownAs.forEach((aka, index) => {
        drawKeyValuePair(
          `AKA ${index + 1}`,
          `${aka.surname || ''} ${aka.otherNames || ''}`,
          currentY
        );
        currentY += 15;
      });
    } else {
      drawKeyValuePair('AKA', 'N/A', currentY);
      currentY += 15;
    }
    currentY += 10;

    // Relatives
    drawSectionHeader('Relatives', currentY);
    currentY += 25;
    if (obituary.relatives.length > 0) {
      obituary.relatives.forEach((relative) => {
        drawKeyValuePair(
          relative.relationship || 'N/A',
          `${relative.givenNames || ''} ${relative.surname || ''} ${relative.predeceased ? '(Predeceased)' : ''}`,
          currentY
        );
        currentY += 15;
      });
    } else {
      drawKeyValuePair('Relatives', 'N/A', currentY);
      currentY += 15;
    }
    currentY += 10;

    // Publication Details
    drawSectionHeader('Publication Details', currentY);
    currentY += 25;
    drawKeyValuePair(
      'Periodical',
      obituary.periodical?.name || 'N/A',
      currentY
    );
    currentY += 15;
    drawKeyValuePair(
      'Publish Date',
      obituary.publishDate?.toDateString() || 'N/A',
      currentY
    );
    currentY += 15;
    drawKeyValuePair('Page', obituary.page || 'N/A', currentY);
    currentY += 15;
    drawKeyValuePair('Column', obituary.column || 'N/A', currentY);
    currentY += 25;

    // Additional Information
    drawSectionHeader('Additional Information', currentY);
    currentY += 25;
    drawKeyValuePair('Proofread', obituary.proofread ? 'Yes' : 'No', currentY);
    currentY += 15;
    drawKeyValuePair('Notes', obituary?.notes || 'N/A', currentY);
    currentY += 25;
   

    // Footer
    const footerText =
      'Compiled by Kelowna & District Genealogical Society PO Box 21105 Kelowna BC Canada V1Y 9N8';
    const copyrightText = '© 2024 Javier Gongora';
    drawText(footerText, 50, height - 30, 8);
    drawText(copyrightText, 50, height - 15, 8);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reference}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// Helper function to wrap text
function wrapText(text: string, maxWidth: number): string[] {
  return text.split(' ').reduce((lines: string[], word: string) => {
    const lastLine = lines[lines.length - 1] || '';
    if ((lastLine + ' ' + word).length <= maxWidth) {
      lines[lines.length - 1] = (lastLine + ' ' + word).trim();
    } else {
      lines.push(word);
    }
    return lines;
  }, []);
}
