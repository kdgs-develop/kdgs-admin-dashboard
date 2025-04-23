import { NextRequest, NextResponse } from "next/server";
import minioClient from "@/lib/minio-client";
import { Readable } from "stream";

export async function GET(
  request: NextRequest,
  { params }: { params: { imageName: string } }
) {
  const imageName = params.imageName;

  // Basic input validation
  if (!imageName || typeof imageName !== "string") {
    return new NextResponse("Invalid image name", { status: 400 });
  }

  const bucketName = process.env.MINIO_BUCKET_NAME;
  if (!bucketName) {
    console.error("MINIO_BUCKET_NAME not set");
    return new NextResponse("Server configuration error", { status: 500 });
  }

  try {
    // Get image metadata (optional but good for Content-Type/Length)
    const stat = await minioClient.statObject(bucketName, imageName);

    // Get image stream from MinIO
    const objectStream = await minioClient.getObject(bucketName, imageName);

    // Ensure the stream is a Node.js Readable stream for NextResponse
    const nodeReadableStream = Readable.from(objectStream);

    // Create and return the Response with download headers
    const response = new NextResponse(nodeReadableStream as any, {
      headers: {
        "Content-Disposition": `attachment; filename="${imageName}"`, // Force download
        "Content-Type":
          stat.metaData?.["content-type"] || "application/octet-stream", // Use stored type or fallback
        "Content-Length": stat.size.toString() // Set content length
      }
    });

    return response;
  } catch (error: any) {
    console.error(`Error fetching image ${imageName} from MinIO:`, error);
    if (error.code === "NoSuchKey" || error.message?.includes("Not Found")) {
      return new NextResponse("Image not found", { status: 404 });
    }
    return new NextResponse("Failed to retrieve image", { status: 500 });
  }
}
