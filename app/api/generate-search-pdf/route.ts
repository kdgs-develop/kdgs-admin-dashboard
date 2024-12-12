import { getObituaries } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// A4 page dimensions in points (pt)
const A4_PAGE = {
  width: 595.28,
  height: 841.89
};

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, totalResults } = await req.json();
    console.log('Received request:', { searchQuery, totalResults });

    if (!searchQuery || !totalResults) {
      return NextResponse.json(
        { error: 'Search query and total results are required' },
        { status: 400 }
      );
    }

    // Get all results for the PDF (no pagination)
    console.log('Fetching obituaries...');
    const { obituaries } = await getObituaries(searchQuery, 0, Number(totalResults));
    console.log(`Found ${obituaries.length} obituaries`);

    if (!obituaries.length) {
      return NextResponse.json(
        { error: 'No results found for the search query' },
        { status: 404 }
      );
    }

    // Create a PDF document
    console.log('Creating PDF document...');
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([A4_PAGE.width, A4_PAGE.height]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Set initial cursor position
    let y = 800;
    const margin = 50;

    // Add header
    page.drawText('KDGS Database - Search Results Report', {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0)
    });

    // Add search information
    y -= 40;
    page.drawText(`Search Query: ${searchQuery}`, {
      x: margin,
      y,
      size: 12,
      font
    });

    y -= 20;
    page.drawText(`Total Results: ${obituaries.length}`, {
      x: margin,
      y,
      size: 12,
      font
    });

    y -= 20;
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: margin,
      y,
      size: 12,
      font
    });

    y -= 40;
    page.drawText('Results:', {
      x: margin,
      y,
      size: 14,
      font: boldFont
    });

    console.log('Starting to add results to PDF...'); // Debug log
    // Add results
    for (let i = 0; i < obituaries.length; i++) {
      const obituary = obituaries[i];
      console.log(`Processing obituary ${i + 1}:`, obituary.reference); // Debug log
      
      const fullName = `${obituary.givenNames || ''} ${obituary.surname || ''}`.trim();

      // Check if we need a new page
      if (y < 100) {
        page = pdfDoc.addPage([A4_PAGE.width, A4_PAGE.height]);
        y = 800;
      }

      y -= 30;
      page.drawText(`${i + 1}. ${fullName}`, {
        x: margin,
        y,
        size: 12,
        font: boldFont
      });

      y -= 20;
      page.drawText(`Reference: ${obituary.reference}`, {
        x: margin + 10,
        y,
        size: 10,
        font
      });

      y -= 15;
      page.drawText(
        `Birth: ${
          obituary.birthDate
            ? new Date(obituary.birthDate).toLocaleDateString()
            : 'Unknown'
        }`,
        {
          x: margin + 10,
          y,
          size: 10,
          font
        }
      );

      y -= 15;
      page.drawText(
        `Death: ${
          obituary.deathDate
            ? new Date(obituary.deathDate).toLocaleDateString()
            : 'Unknown'
        }`,
        {
          x: margin + 10,
          y,
          size: 10,
          font
        }
      );

      if (obituary.notes) {
        y -= 15;
        page.drawText(`Notes: ${obituary.notes}`, {
          x: margin + 10,
          y,
          size: 10,
          font
        });
      }

      y -= 10; // Add some space between entries
    }
    console.log('Finished adding results to PDF'); // Debug log

    console.log('PDF generation completed');
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