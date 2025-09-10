import { prisma } from "@/lib/prisma";
import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFFont,
  PDFPage,
  PDFName,
  PDFString
  // Add any other pdf-lib imports your full generation logic needs
} from "pdf-lib";

// You might need to define interfaces for the data passed to drawing functions
// e.g., interface ObituaryDataForPdf { ... };

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
  if (!text) return [""];

  const processedText = text.replace(/\r\n|\r|\n/g, " ");
  const words = processedText.split(" ");
  const lines: string[] = [];

  if (words.length === 0) return [""];
  if (words.length === 1 && words[0] === "") return [""];

  let currentLine = words[0];

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
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

export async function generateObituaryPdfBytes(
  obituaryRef: string
): Promise<Uint8Array | null> {
  try {
    const obituary = await prisma.obituary.findUnique({
      where: { reference: obituaryRef },
      include: {
        title: true,
        birthCity: { include: { country: true } },
        deathCity: { include: { country: true } },
        cemetery: {
          include: {
            city: {
              include: {
                country: true
              }
            }
          }
        },
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
      console.error(`Obituary ${obituaryRef} not found for PDF generation.`);
      return null;
    }

    const pdfDoc = await PDFDocument.create();
    let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let currentY = TOP_MARGIN;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const modernBlue = rgb(0.1, 0.4, 0.7);
    const black = rgb(0, 0, 0);

    const logoUrl = "https://kdgs-admin-dashboard.vercel.app/kdgs.png";
    let logoImage: any;
    try {
      const logoImageBytes = await fetch(logoUrl).then(res =>
        res.arrayBuffer()
      );
      logoImage = await pdfDoc.embedPng(logoImageBytes);
    } catch (e) {
      console.error("Failed to load or embed logo:", e);
      logoImage = null;
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

    drawPageFixedHeader(currentPage, 1);

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
      const lineAndPadding = thickness + 4;
      checkSpaceAndAddNewPage(lineAndPadding);
      const { width: pageWidth, height: pageHeight } = currentPage.getSize();
      currentPage.drawLine({
        start: { x: MARGIN, y: pageHeight - (currentY + thickness / 2) },
        end: {
          x: pageWidth - MARGIN,
          y: pageHeight - (currentY + thickness / 2)
        },
        thickness: thickness,
        color: color
      });
      currentY += lineAndPadding;
    };

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
      currentY += HEADER_FONT_SIZE + LINE_HEIGHT * 0.5;
    }

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
      drawTextLineAndAdvance(keyText, MARGIN, TEXT_FONT_SIZE, true);

      currentY = initialYForPair;
      drawWrappedTextAndAdvance(valueLines, VALUE_X_OFFSET, TEXT_FONT_SIZE);
      currentY = initialYForPair + requiredHeight;
    };

    drawInitialInfoPair("File Number", obituary.reference, MAX_VALUE_WIDTH);
    const fullName =
      `${obituary.title?.name || ""} ${obituary.givenNames || ""} ${obituary.surname || ""}`.trim();
    drawInitialInfoPair("Full Name", fullName, MAX_VALUE_WIDTH);

    currentY += LINE_HEIGHT * 0.5;

    const drawSectionHeaderAndAdvance = (title: string) => {
      const headerTotalHeight = SECTION_HEADER_FONT_SIZE + LINE_HEIGHT;
      checkSpaceAndAddNewPage(headerTotalHeight);
      const { height: pageHeight, width: pageWidth } = currentPage.getSize();
      currentPage.drawText(title, {
        x: MARGIN,
        y: pageHeight - currentY,
        size: SECTION_HEADER_FONT_SIZE,
        font: boldFont,
        color: modernBlue
      });
      currentY += SECTION_HEADER_FONT_SIZE * 0.75;

      currentPage.drawLine({
        start: { x: MARGIN, y: pageHeight - currentY },
        end: { x: pageWidth - MARGIN, y: pageHeight - currentY },
        thickness: 0.5,
        color: modernBlue
      });
      currentY += LINE_HEIGHT;
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
      const requiredHeight = Math.max(
        LINE_HEIGHT,
        wrappedValueLines.length * LINE_HEIGHT
      );
      checkSpaceAndAddNewPage(requiredHeight);
      const initialYForKeyValue = currentY;
      drawTextLineAndAdvance(`${key}:`, MARGIN, TEXT_FONT_SIZE, true);
      currentY = initialYForKeyValue;
      drawWrappedTextAndAdvance(
        wrappedValueLines,
        VALUE_X_OFFSET,
        TEXT_FONT_SIZE
      );
      currentY = initialYForKeyValue + requiredHeight;
      currentY += LINE_HEIGHT * 0.25;
    };

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
    const internmentPlace = [
      obituary.cemetery?.name,
      obituary.cemetery?.city?.name,
      obituary.cemetery?.city?.province,
      obituary.cemetery?.city?.country?.name
    ]
      .filter(Boolean)
      .join(", ");
    drawObituaryKeyValuePair("Internment Place", internmentPlace);
    currentY += LINE_HEIGHT * 0.5;

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
    drawObituaryKeyValuePair("Notes", obituary.notes);
    currentY += LINE_HEIGHT * 0.5;

    const totalGeneratedPages = pdfDoc.getPageCount();
    for (let i = 0; i < totalGeneratedPages; i++) {
      const pageToFooter = pdfDoc.getPage(i);
      const { width: Pwidth, height: Pheight } = pageToFooter.getSize();
      const currentYearFooter = new Date().getFullYear();
      const copyrightText = `© ${currentYearFooter} Kelowna & District Genealogical Society`;
      const websiteText = "kdgs.ca";
      const developerText = " | Powered by Vyoniq Technologies";
      const footerLineY = BOTTOM_MARGIN - 10;

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

      const targetArray =
        (annotsArray as any).array ||
        (annotsArray as any).getTarget?.() ||
        annotsArray;

      if (Array.isArray(targetArray)) {
        targetArray.push(annotationDict);
      } else if (
        targetArray &&
        typeof (targetArray as any).push === "function"
      ) {
        (targetArray as any).push(annotationDict);
      } else {
        console.warn(
          "Could not add link annotation: Annots array not found or not an array."
        );
      }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error(`Error generating PDF for obituary ${obituaryRef}:`, error);
    return null;
  }
}
