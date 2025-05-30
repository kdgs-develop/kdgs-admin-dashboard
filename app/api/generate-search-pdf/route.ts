import { getObituariesGeneratePDF } from "@/lib/db";
import minioClient from "@/lib/minio-client";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import {
  PDFDocument,
  PDFPage,
  rgb,
  StandardFonts,
  PDFName,
  PDFString
} from "pdf-lib";

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MARGIN = 35;
const RECORDS_PER_PAGE = 30;
const LINE_HEIGHT = 12;
const KDGS_LOGO_URL = "https://kdgs-admin-dashboard.vercel.app/kdgs.png";
const MAX_SURNAME_LENGTH = 18;
const MAX_GIVEN_NAMES_LENGTH = 20;

// Define column widths and positions
const COLUMNS = {
  number: { width: 25, x: MARGIN },
  reference: { width: 65, x: MARGIN + 25 },
  surname: { width: 110, x: MARGIN + 90 },
  givenNames: { width: 110, x: MARGIN + 200 },
  deathDate: { width: 75, x: MARGIN + 310 },
  proofread: { width: 30, x: MARGIN + 385 },
  fileBox: { width: 40, x: MARGIN + 415 },
  images: { width: 85, x: MARGIN + 455 }
};

// Adjust vertical spacing between rows - slightly more than current 4 but less than original 8
const ROW_PADDING = 6; // Changed from 4 to 6 for a little more spacing between rows

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { obituaries } = await getObituariesGeneratePDF(searchQuery);

    if (!obituaries.length) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Fetch and embed the KDGS logo
    const logoImageBytes = await fetch(KDGS_LOGO_URL).then(res =>
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

        // Make title smaller and position higher
        const title = "Search Results Report";
        page.drawText(title, {
          x: MARGIN,
          y: height - MARGIN + 5,
          size: 14,
          font: boldFont
        });

        // Compress vertical spacing between header elements
        page.drawText(`Search Query: ${searchQuery}`, {
          x: MARGIN,
          y: height - MARGIN - 15,
          size: 11,
          font: boldFont
        });

        page.drawText(`Total Results: ${obituaries.length}`, {
          x: MARGIN,
          y: height - MARGIN - 28,
          size: 11,
          font: boldFont
        });

        page.drawText(`Page ${pageNumber} of ${totalPages}`, {
          x: MARGIN,
          y: height - MARGIN - 40,
          size: 9,
          font: font
        });

        // Draw KDGS logo with adjusted position (smaller and moved up further)
        page.drawImage(logoImage, {
          x: width - 135,
          y: height - 60,
          width: 85,
          height: 42
        });

        // Add table headers closer to the top content
        const headerY = height - MARGIN - 65;
        page.drawText("#", {
          x: COLUMNS.number.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText("File #", {
          x: COLUMNS.reference.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText("Surname", {
          x: COLUMNS.surname.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText("Given Names", {
          x: COLUMNS.givenNames.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText("Death Date", {
          x: COLUMNS.deathDate.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText("PR", {
          x: COLUMNS.proofread.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText("Box #", {
          x: COLUMNS.fileBox.x,
          y: headerY,
          size: 10,
          font: boldFont
        });
        page.drawText("Images", {
          x: COLUMNS.images.x,
          y: headerY,
          size: 10,
          font: boldFont
        });

        return height - MARGIN - 80;
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

        page.drawText(obituary.reference || "", {
          x: COLUMNS.reference.x,
          y: rowCenter,
          size: 9,
          font: font
        });

        page.drawText(
          obituary.surname?.[MAX_SURNAME_LENGTH]
            ? `${(obituary.surname || "").slice(0, MAX_SURNAME_LENGTH)}...`
            : (obituary.surname || "").slice(0, MAX_SURNAME_LENGTH),
          {
            x: COLUMNS.surname.x,
            y: rowCenter,
            size: 9,
            font: font
          }
        );

        page.drawText(
          obituary.givenNames?.[MAX_GIVEN_NAMES_LENGTH]
            ? `${(obituary.givenNames || "").slice(0, MAX_GIVEN_NAMES_LENGTH)}...`
            : (obituary.givenNames || "").slice(0, MAX_GIVEN_NAMES_LENGTH),
          {
            x: COLUMNS.givenNames.x,
            y: rowCenter,
            size: 9,
            font: font
          }
        );

        if (obituary.deathDate) {
          page.drawText(format(new Date(obituary.deathDate), "yyyy-MM-dd"), {
            x: COLUMNS.deathDate.x,
            y: rowCenter,
            size: 9,
            font: font
          });
        }

        page.drawText(obituary.proofread ? "Yes" : "No", {
          x: COLUMNS.proofread.x,
          y: rowCenter,
          size: 9,
          font: font
        });

        // Add File Box information
        const fileBoxText =
          obituary.fileBox?.year !== 0 && obituary.fileBox?.year !== undefined
            ? `${obituary.fileBox?.year}-${obituary.fileBox?.number}`
            : "None";
        page.drawText(fileBoxText, {
          x: COLUMNS.fileBox.x,
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
          if (obituary.imageNames![3]) {
            page.drawText(obituary.imageNames![3].slice(0, 15), {
              x: COLUMNS.images.x,
              y: yPos - LINE_HEIGHT * 3,
              size: 8,
              font: font,
              color: rgb(0.4, 0.4, 0.4)
            });
          }
          if (obituary.imageNames![4]) {
            page.drawText(obituary.imageNames![4].slice(0, 15), {
              x: COLUMNS.images.x,
              y: yPos - LINE_HEIGHT * 4,
              size: 8,
              font: font,
              color: rgb(0.4, 0.4, 0.4)
            });
          }
        } else {
          page.drawText("None", {
            x: COLUMNS.images.x,
            y: yPos,
            size: 9,
            font: font
          });
        }

        // Reduce the vertical padding between rows (changed from 8 to ROW_PADDING)
        yPos -= rowHeight + ROW_PADDING;
      }

      // Add footer with dynamic current year
      const footerY = MARGIN - 5;
      const currentYear = new Date().getFullYear();

      // Footer parts - matching the format from generate-pdf/[reference]/route.ts
      const copyrightText = `© ${currentYear} Kelowna & District Genealogical Society`;
      const websiteText = "kdgs.ca";
      const developerText = " | Powered by Vyoniq Technologies";

      // Draw copyright text in black
      page.drawText(copyrightText, {
        x: MARGIN,
        y: footerY + 10,
        size: 7,
        font: font
      });

      // Calculate position for website text
      const copyrightWidth = font.widthOfTextAtSize(copyrightText + " ", 7);
      const websiteWidth = font.widthOfTextAtSize(websiteText, 7);

      // Draw website text in blue
      page.drawText(websiteText, {
        x: MARGIN + copyrightWidth,
        y: footerY + 10,
        size: 7,
        font: font,
        color: rgb(0, 0, 1) // Blue color
      });

      // Draw developer text in black
      page.drawText(developerText, {
        x: MARGIN + copyrightWidth + websiteWidth,
        y: footerY + 10,
        size: 7,
        font: font
      });

      // Create hyperlink annotation
      const hyperlinkAnnotation = {
        Type: "Annot",
        Subtype: "Link",
        Rect: [
          MARGIN + copyrightWidth, // x1
          footerY + 5, // y1
          MARGIN + copyrightWidth + websiteWidth, // x2
          footerY + 15 // y2
        ],
        Border: [0, 0, 0],
        A: {
          Type: "Action",
          S: "URI",
          URI: PDFString.of("https://kdgs.ca")
        }
      };

      // Register the annotation and add it to the page
      const annot = pdfDoc.context.register(
        pdfDoc.context.obj(hyperlinkAnnotation)
      );

      // Simply set annotations - no need to worry about existing ones in this case
      page.node.set(PDFName.of("Annots"), pdfDoc.context.obj([annot]));
    }

    const pdfBytes = await pdfDoc.save();

    // Save to MinIO first
    const sanitizedQuery = searchQuery.replace(/@/g, "").replace(/\s+/g, "-");
    const fileName = `kdgs-report-${sanitizedQuery}-${Date.now()}.pdf`;
    const bucketName = process.env.MINIO_BUCKET_NAME!;

    try {
      await minioClient.putObject(
        bucketName,
        `reports/${fileName}`, // Note the 'reports/' prefix
        Buffer.from(pdfBytes)
      );
    } catch (error) {
      console.error("Error saving PDF to MinIO:", error);
      throw new Error("Failed to save report");
    }

    // Convert to base64 for immediate download
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Save report record to database
    const genealogist = await prisma.genealogist.findUnique({
      where: { clerkId: userId }
    });

    if (!genealogist) {
      throw new Error("Genealogist not found");
    }

    await prisma.report.create({
      data: {
        fileName,
        searchQuery,
        userId,
        role: genealogist.role || "",
        totalResults: obituaries.length
      }
    });

    // Return the PDF data URL
    return NextResponse.json({ pdf: pdfUrl });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
