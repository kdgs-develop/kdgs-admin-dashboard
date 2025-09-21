import { updateObituaryImageNames } from "@/app/dashboard/actions";
import { prisma } from "@/lib/prisma";
import { Client } from "minio";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT!),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME!;
const MAX_RETRIES = 3;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    await uploadFile(file);
    // Add image name to obituary imagesNames property

    return NextResponse.json({ message: `Successfully uploaded ${file.name}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

async function uploadFile(file: File): Promise<void> {
  const fileBuffer = await file.arrayBuffer();
  const fileStream = Readable.from(Buffer.from(fileBuffer));

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const uploadResponse = await minioClient.putObject(
        BUCKET_NAME,
        file.name,
        fileStream,
        file.size,
        { "Content-Type": file.type }
      );

      const size = file.size;
      // Only create an image record if an obituary with the 8 first characters of the file name exists.
      const reference = file.name.slice(0, 8);
      const obituary = await prisma.obituary.findUnique({
        where: { reference }
      });
      if (obituary) {
        await prisma.image.create({
          data: {
            name: file.name,
            size,
            lastModified: new Date(),
            etag: uploadResponse.etag,
            reference: reference
          }
        });
        await updateObituaryImageNames(obituary.id);
      }
      return;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed for ${file.name}:`, error);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(
          `Failed to upload ${file.name} after ${MAX_RETRIES} attempts`
        );
      }
    }
  }
}
