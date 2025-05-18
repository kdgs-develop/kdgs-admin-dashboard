import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFName,
  PDFString,
  PDFFont,
  PDFPage
} from "pdf-lib";

// Page and Layout Constants
const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 800;
const MARGIN = 50;
const TOP_MARGIN = 50;
const BOTTOM_MARGIN = 50; // Content should not go below this Y before footer
const HEADER_FONT_SIZE = 20;
const SECTION_HEADER_FONT_SIZE = 14;
const TEXT_FONT_SIZE = 10;
const LINE_HEIGHT = 15; // Approximate height for a line of text
const VALUE_X_OFFSET = 150; // X position for the value part of key-value pairs
const MAX_VALUE_WIDTH = PAGE_WIDTH - VALUE_X_OFFSET - MARGIN;

// Helper function to wrap text
function wrapTextHelper(
  text: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number
): string[] {
  if (!text) return [""]; // Return array with one empty string for consistent spacing

  // Preprocess text to handle newlines before splitting into words
  const processedText = text.replace(/\r\n|\r|\n/g, " ");

  const words = processedText.split(" "); // Use processedText here
  const lines: string[] = [];

  if (words.length === 0) return [""];
  if (words.length === 1 && words[0] === "") return [""];

  let currentLine = words[0];

  // Handle cases where the first word itself is too long
  while (
    font.widthOfTextAtSize(currentLine, fontSize) > maxWidth &&
    currentLine.length > 0
  ) {
    let splitIndex = 0;
    for (let k = 1; k <= currentLine.length; k++) {
      if (
        font.widthOfTextAtSize(currentLine.substring(0, k), fontSize) > maxWidth
      ) {
        splitIndex = k - 1;
        break;
      }
    }
    if (splitIndex > 0) {
      lines.push(currentLine.substring(0, splitIndex));
      currentLine = currentLine.substring(splitIndex);
    } else {
      // Word is shorter than maxwidth or could not be split (e.g. single char > width)
      break;
    }
  }

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + " " + word;
    if (font.widthOfTextAtSize(testLine, fontSize) < maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
      // Handle if this new current word is too long
      while (
        font.widthOfTextAtSize(currentLine, fontSize) > maxWidth &&
        currentLine.length > 0
      ) {
        let splitIndex = 0;
        for (let k = 1; k <= currentLine.length; k++) {
          if (
            font.widthOfTextAtSize(currentLine.substring(0, k), fontSize) >
            maxWidth
          ) {
            splitIndex = k - 1;
            break;
          }
        }
        if (splitIndex > 0) {
          lines.push(currentLine.substring(0, splitIndex));
          currentLine = currentLine.substring(splitIndex);
        } else {
          break;
        }
      }
    }
  }
  if (currentLine) {
    // Push any remaining part of currentLine
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

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
        relatives: {
          include: {
            familyRelationship: true
          }
        },
        alsoKnownAs: true
      }
    });

    if (!obituary) {
      return NextResponse.json(
        { error: "Obituary not found" },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let currentY = TOP_MARGIN; // Y position from the top of the page

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const modernBlue = rgb(0.1, 0.4, 0.7);
    const black = rgb(0, 0, 0);

    const logoUrl = "https://kdgs-admin-dashboard.vercel.app/kdgs.png";
    let logoImage: any; // Store embedded image to reuse
    try {
      const logoImageBytes = await fetch(logoUrl).then(res =>
        res.arrayBuffer()
      );
      logoImage = await pdfDoc.embedPng(logoImageBytes);
    } catch (e) {
      console.error("Failed to load or embed logo:", e);
      logoImage = null; // Continue without logo if it fails
    }

    const addNewPage = () => {
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      currentY = TOP_MARGIN;
      drawPageFixedHeader(currentPage, pdfDoc.getPageCount());
    };

    const checkSpaceAndAddNewPage = (spaceNeeded: number) => {
      if (currentY + spaceNeeded > PAGE_HEIGHT - BOTTOM_MARGIN) {
        addNewPage();
      }
    };

    const drawPageFixedHeader = (page: PDFPage, pageNumber: number) => {
      const { width: pageWidth, height: pageHeight } = page.getSize();
      if (logoImage && pageNumber === 1) {
        page.drawImage(logoImage, {
          x: pageWidth - MARGIN - 100,
          y: pageHeight - TOP_MARGIN - 10,
          width: 100,
          height: 50
        });
      }
    };

    drawPageFixedHeader(currentPage, 1); // Initial header for the first page

    // Function to draw a single line of text and advance currentY
    const drawTextLineAndAdvance = (
      text: string,
      x: number,
      size: number,
      isBold = false,
      color = black,
      useFont?: PDFFont
    ) => {
      checkSpaceAndAddNewPage(LINE_HEIGHT);
      const { height: pageHeight } = currentPage.getSize();
      currentPage.drawText(text, {
        x,
        y: pageHeight - currentY,
        size,
        font: useFont || (isBold ? boldFont : font),
        color: color
      });
      currentY += LINE_HEIGHT;
    };

    // Function to draw multiple lines of pre-wrapped text
    const drawWrappedTextAndAdvance = (
      lines: string[],
      x: number,
      size: number,
      isBold = false,
      color = black,
      useFont?: PDFFont
    ) => {
      for (const line of lines) {
        drawTextLineAndAdvance(line, x, size, isBold, color, useFont);
      }
    };

    const drawHorizontalLineAndAdvance = (
      color = modernBlue,
      thickness = 1
    ) => {
      const lineAndPadding = thickness + 4; // Add some padding around the line
      checkSpaceAndAddNewPage(lineAndPadding);
      const { width: pageWidth, height: pageHeight } = currentPage.getSize();
      currentPage.drawLine({
        start: { x: MARGIN, y: pageHeight - (currentY + thickness / 2) }, // Center thickness on currentY
        end: {
          x: pageWidth - MARGIN,
          y: pageHeight - (currentY + thickness / 2)
        },
        thickness: thickness,
        color: color
      });
      currentY += lineAndPadding;
    };

    // Main Report Header - only on the very first page, after fixed header
    if (pdfDoc.getPageCount() === 1) {
      checkSpaceAndAddNewPage(HEADER_FONT_SIZE + LINE_HEIGHT);
      const { height: pageHeight } = currentPage.getSize();
      currentPage.drawText("Obituary Index Report", {
        x: MARGIN,
        y: pageHeight - currentY,
        size: HEADER_FONT_SIZE,
        font: boldFont,
        color: modernBlue
      });
      currentY += HEADER_FONT_SIZE + LINE_HEIGHT * 0.5; // Advance Y after large header
    }

    // File Number and Full Name - drawn with awareness of potential wrapping for full name
    const drawInitialInfoPair = (
      key: string,
      value: string,
      valueMaxWidth: number
    ) => {
      const keyText = `${key}:`;
      const valueLines = wrapTextHelper(
        value,
        valueMaxWidth,
        font,
        TEXT_FONT_SIZE
      );
      const requiredHeight = Math.max(
        LINE_HEIGHT,
        valueLines.length * LINE_HEIGHT
      );
      checkSpaceAndAddNewPage(requiredHeight);

      const initialYForPair = currentY;
      drawTextLineAndAdvance(keyText, MARGIN, TEXT_FONT_SIZE, true); // Draws key, advances currentY

      // Draw value lines starting from the same logical line height as the key.
      currentY = initialYForPair; // Reset Y to draw value next to key.
      drawWrappedTextAndAdvance(valueLines, VALUE_X_OFFSET, TEXT_FONT_SIZE);
      // currentY is now at the end of the wrapped value.
      // Ensure currentY reflects the tallest element (key or value block).
      currentY = initialYForPair + requiredHeight;
    };

    drawInitialInfoPair("File Number", obituary.reference, MAX_VALUE_WIDTH);
    const fullName =
      `${obituary.title?.name || ""} ${obituary.givenNames || ""} ${obituary.surname || ""}`.trim();
    drawInitialInfoPair("Full Name", fullName, MAX_VALUE_WIDTH);

    currentY += LINE_HEIGHT * 0.5; // Add a small gap before the first section starts

    const drawSectionHeaderAndAdvance = (title: string) => {
      const headerTotalHeight = SECTION_HEADER_FONT_SIZE + LINE_HEIGHT; // Text + line + spacing
      checkSpaceAndAddNewPage(headerTotalHeight);
      const { height: pageHeight, width: pageWidth } = currentPage.getSize();
      currentPage.drawText(title, {
        x: MARGIN,
        y: pageHeight - currentY,
        size: SECTION_HEADER_FONT_SIZE,
        font: boldFont,
        color: modernBlue
      });
      currentY += SECTION_HEADER_FONT_SIZE * 0.75; // Advance for text height

      currentPage.drawLine({
        start: { x: MARGIN, y: pageHeight - currentY },
        end: { x: pageWidth - MARGIN, y: pageHeight - currentY },
        thickness: 0.5,
        color: modernBlue
      });
      currentY += LINE_HEIGHT; // Space after header line
    };

    const drawObituaryKeyValuePair = (
      key: string,
      value: string | null | undefined
    ) => {
      const valText = value || "";
      const wrappedValueLines = wrapTextHelper(
        valText,
        MAX_VALUE_WIDTH,
        font,
        TEXT_FONT_SIZE
      );

      // Calculate height needed for this item (key is 1 line, value can be multiple)
      const requiredHeight = Math.max(
        LINE_HEIGHT,
        wrappedValueLines.length * LINE_HEIGHT
      );
      checkSpaceAndAddNewPage(requiredHeight);

      const initialYForKeyValue = currentY;
      // Draw key text (advances currentY by one LINE_HEIGHT)
      drawTextLineAndAdvance(`${key}:`, MARGIN, TEXT_FONT_SIZE, true);

      // Reset currentY to draw value lines starting at the same Y as the key, but offset horizontally
      currentY = initialYForKeyValue;
      drawWrappedTextAndAdvance(
        wrappedValueLines,
        VALUE_X_OFFSET,
        TEXT_FONT_SIZE
      );

      // Ensure currentY is set to after the tallest part (key or multi-line value)
      currentY = initialYForKeyValue + requiredHeight;
      currentY += LINE_HEIGHT * 0.25; // Small padding after each key-value pair
    };

    // --- Sections ---
    drawSectionHeaderAndAdvance("Personal Information");
    drawObituaryKeyValuePair("Title", obituary.title?.name);
    drawObituaryKeyValuePair("Given Names", obituary.givenNames);
    drawObituaryKeyValuePair("Surname", obituary.surname);
    drawObituaryKeyValuePair("Maiden Name", obituary.maidenName);
    drawObituaryKeyValuePair("Birth Date", obituary.birthDate?.toDateString());
    const birthPlace = [
      obituary.birthCity?.name,
      obituary.birthCity?.province,
      obituary.birthCity?.country?.name
    ]
      .filter(Boolean)
      .join(", ");
    drawObituaryKeyValuePair("Place of Birth", birthPlace);
    drawObituaryKeyValuePair("Death Date", obituary.deathDate?.toDateString());
    const deathPlace = [
      obituary.deathCity?.name,
      obituary.deathCity?.province,
      obituary.deathCity?.country?.name
    ]
      .filter(Boolean)
      .join(", ");
    drawObituaryKeyValuePair("Place of Death", deathPlace);
    currentY += LINE_HEIGHT * 0.5; // Extra space after section

    if (obituary.alsoKnownAs && obituary.alsoKnownAs.length > 0) {
      drawSectionHeaderAndAdvance("Also Known As");
      obituary.alsoKnownAs.forEach((aka, index) => {
        drawObituaryKeyValuePair(
          `AKA ${index + 1}`,
          `${aka.surname || ""} ${aka.otherNames || ""}`.trim()
        );
      });
      currentY += LINE_HEIGHT * 0.5;
    }

    if (obituary.relatives && obituary.relatives.length > 0) {
      drawSectionHeaderAndAdvance("Relatives");
      obituary.relatives.forEach(relative => {
        drawObituaryKeyValuePair(
          relative.familyRelationship?.name ||
            relative.relationship ||
            "Relative",
          `${relative.givenNames || ""} ${relative.surname || ""} ${relative.predeceased ? "(Predeceased)" : ""}`.trim()
        );
      });
      currentY += LINE_HEIGHT * 0.5;
    }

    drawSectionHeaderAndAdvance("Publication Details");
    drawObituaryKeyValuePair("Periodical", obituary.periodical?.name);
    drawObituaryKeyValuePair(
      "Publish Date",
      obituary.publishDate?.toDateString()
    );
    drawObituaryKeyValuePair("Page", obituary.page);
    drawObituaryKeyValuePair("Column", obituary.column);
    currentY += LINE_HEIGHT * 0.5;

    drawSectionHeaderAndAdvance("Additional Information");
    drawObituaryKeyValuePair("Proofread", obituary.proofread ? "Yes" : "No");
    drawObituaryKeyValuePair("Notes", obituary.notes); // This will use the wrapping
    currentY += LINE_HEIGHT * 0.5;

    // Footer for all pages
    const totalGeneratedPages = pdfDoc.getPageCount();
    for (let i = 0; i < totalGeneratedPages; i++) {
      const pageToFooter = pdfDoc.getPage(i);
      const { width: Pwidth, height: Pheight } = pageToFooter.getSize();

      const currentYearFooter = new Date().getFullYear();
      const copyrightText = `© ${currentYearFooter} Kelowna & District Genealogical Society`;
      const websiteText = "kdgs.ca";
      const developerText =
        " | Developed by Javier Gongora — Vyoniq Technologies";

      const footerLineY = BOTTOM_MARGIN - 10; // Y from bottom for pdf-lib text (e.g. 30 from bottom is y=30)

      pageToFooter.drawText(copyrightText, {
        x: MARGIN,
        y: footerLineY,
        size: 8,
        font: font,
        color: black
      });

      const copyrightWidth = font.widthOfTextAtSize(copyrightText + " ", 8);
      const websiteWidth = font.widthOfTextAtSize(websiteText, 8);

      pageToFooter.drawText(websiteText, {
        x: MARGIN + copyrightWidth,
        y: footerLineY,
        size: 8,
        font: font,
        color: rgb(0, 0, 1)
      });

      pageToFooter.drawText(developerText, {
        x: MARGIN + copyrightWidth + websiteWidth,
        y: footerLineY,
        size: 8,
        font: font,
        color: black
      });

      const linkRect = {
        x: MARGIN + copyrightWidth,
        y: footerLineY - 2,
        width: websiteWidth,
        height: 10
      };

      const uriAction = pdfDoc.context.obj({
        Type: "Action",
        S: "URI",
        URI: PDFString.of("https://kdgs.ca")
      });
      const annotationDict = pdfDoc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [
          linkRect.x,
          linkRect.y,
          linkRect.x + linkRect.width,
          linkRect.y + linkRect.height
        ],
        Border: [0, 0, 0],
        A: uriAction
      });

      let annotsArray = pageToFooter.node.lookup(PDFName.of("Annots"));
      if (!annotsArray) {
        annotsArray = pdfDoc.context.obj([]);
        pageToFooter.node.set(PDFName.of("Annots"), annotsArray);
      }
      // Ensure annotsArray.target is the actual array if it's wrapped
      const targetArray = Array.isArray((annotsArray as any).target)
        ? (annotsArray as any).target
        : annotsArray;
      (targetArray as any).push(annotationDict);
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${reference}_Obituary_Report.pdf"`
      }
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate PDF", details: errorMessage },
      { status: 500 }
    );
  }
}
