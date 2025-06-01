import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import minioClient from "@/lib/minio-client";
import JSZip from "jszip";
import { Readable } from "stream";
import { getObituaryImageUrls } from "@/lib/actions/public-search/get-obituary-image-urls";
import { generateObituaryPdfBytes } from "@/lib/pdf-generation";

// Function to sanitize filenames for wider compatibility
function sanitizeFilename(filename: string): string {
  // Allow alphanumeric, dots, hyphens, underscores. Replace others.
  // For maximum iOS safety, we might be even stricter, e.g., only A-Za-z0-9.
  let sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  // Prevent multiple consecutive dots or underscores if that was the replacement
  sanitized = sanitized.replace(/\.{2,}/g, ".").replace(/_{2,}/g, "_");
  // Ensure it doesn't start or end with a dot or underscore
  sanitized = sanitized.replace(/^[_.]+|[_.]+$/g, "");
  return sanitized || "file"; // Fallback if empty after sanitize
}

export async function GET(
  request: NextRequest,
  { params }: { params: { obituaryRef: string } }
) {
  const { obituaryRef } = params;

  if (!obituaryRef) {
    return NextResponse.json(
      { error: "Obituary reference is required" },
      { status: 400 }
    );
  }

  const safeObituaryRef = sanitizeFilename(obituaryRef); // Sanitize the ref for use in filenames

  const bucketName = process.env.MINIO_BUCKET_NAME;
  if (!bucketName) {
    console.error("MINIO_BUCKET_NAME not set");
    return NextResponse.json(
      { error: "Server configuration error (MinIO bucket)" },
      { status: 500 }
    );
  }

  try {
    const zip = new JSZip();

    // --- 1. Generate PDF ---
    const pdfBytes = await generateObituaryPdfBytes(obituaryRef);

    if (pdfBytes) {
      zip.file(`Report-${safeObituaryRef}.pdf`, pdfBytes);
    } else {
      // If PDF generation fails, we might still want to provide images,
      // or return an error. For now, logging and continuing.
      console.warn(
        `PDF generation failed for ${obituaryRef}. Zip will not include PDF.`
      );
      // Optionally, add a text file to the zip indicating PDF failure:
      // zip.file(`ERROR_PDF_GENERATION_FAILED_${obituaryRef}.txt`, "The PDF report could not be generated.");
    }

    // --- 2. Fetch and Add Images ---
    const imageDetails = await getObituaryImageUrls(obituaryRef);

    if (imageDetails.error) {
      console.warn(
        `Could not retrieve image URLs for ${obituaryRef}: ${imageDetails.error}`
      );
      if (!pdfBytes) {
        // If PDF also failed, then there's nothing to send.
        return NextResponse.json(
          { error: "Failed to retrieve any files for this obituary." },
          { status: 404 }
        );
      }
    } else if (imageDetails.imageNames && imageDetails.imageNames.length > 0) {
      for (const imageName of imageDetails.imageNames) {
        try {
          const objectStream = await minioClient.getObject(
            bucketName,
            imageName
          );
          const chunks = [];
          for await (const chunk of objectStream) {
            chunks.push(chunk);
          }
          const imageNodeBuffer = Buffer.concat(chunks);
          const imageUint8Array = new Uint8Array(imageNodeBuffer);
          // Sanitize image name for storing in zip, ensure extension is preserved
          const extension = imageName.includes(".")
            ? imageName.substring(imageName.lastIndexOf("."))
            : "";
          const baseName = imageName.includes(".")
            ? imageName.substring(0, imageName.lastIndexOf("."))
            : imageName;
          const safeImageName = sanitizeFilename(baseName) + extension;
          zip.file(safeImageName, imageUint8Array);
        } catch (imgError) {
          console.error(
            `Failed to fetch or add image ${imageName} to zip for ${obituaryRef}:`,
            imgError
          );
          // Optionally add a placeholder/error file for this specific image
          // zip.file(`ERROR_IMAGE_${imageName}_FAILED.txt`, `Could not retrieve image: ${imageName}`);
        }
      }
    } else {
      console.log(
        `No images found for obituary ${obituaryRef} as per getObituaryImageUrls.`
      );
    }

    // If we have neither PDF nor images, and didn't error out earlier for PDF failure + image error:
    if (
      zip.files[`Report-${safeObituaryRef}.pdf`] === undefined &&
      Object.keys(zip.files).length === 0
    ) {
      console.error(
        `No files (PDF or images) could be added to the zip for ${obituaryRef}.`
      );
      return NextResponse.json(
        { error: "No downloadable files found for this obituary reference." },
        { status: 404 }
      );
    }

    // --- 3. Generate and Send Zip ---
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Use sanitized ref for the downloadable zip filename
    const zipFilename = `ObituaryFiles-${safeObituaryRef}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Content-Type": "application/zip",
        "Content-Length": zipBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error(
      `Error generating zip file for obituary ${obituaryRef}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to generate zip file" },
      { status: 500 }
    );
  }
}
