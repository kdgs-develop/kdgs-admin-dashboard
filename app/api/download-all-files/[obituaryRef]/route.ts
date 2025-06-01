import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import minioClient from "@/lib/minio-client";
import JSZip from "jszip";
import { Readable } from "stream";
import { getObituaryImageUrls } from "@/lib/actions/public-search/get-obituary-image-urls";
import { generateObituaryPdfBytes } from "@/lib/pdf-generation";

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
      zip.file(`obituary_report_${obituaryRef}.pdf`, pdfBytes);
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
          // Provide Uint8Array view of the buffer to JSZip
          const imageUint8Array = new Uint8Array(imageNodeBuffer);
          zip.file(imageName, imageUint8Array);
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
      zip.files[`obituary_report_${obituaryRef}.pdf`] === undefined &&
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

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="obituary_files_${obituaryRef}.zip"`,
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
