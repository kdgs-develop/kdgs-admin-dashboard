import { NextRequest, NextResponse } from "next/server";
import { Client } from "minio";
import path from "path";

export async function GET(req: NextRequest) {
  // Initialize MinIO client
  const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || "",
    port: parseInt(process.env.MINIO_PORT || "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || ""
  });

  const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "";

  // Validate required environment variables
  if (
    !process.env.MINIO_ENDPOINT ||
    !process.env.MINIO_ACCESS_KEY ||
    !process.env.MINIO_SECRET_KEY ||
    !process.env.MINIO_BUCKET_NAME
  ) {
    return NextResponse.json(
      { error: "MinIO configuration is incomplete" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json(
      { error: "Filename is required" },
      { status: 400 }
    );
  }

  const filenameWithoutExt = path.parse(filename).name;

  try {
    const objects = await minioClient.listObjects(
      BUCKET_NAME,
      filenameWithoutExt,
      true
    );
    let exists = false;

    for await (const obj of objects) {
      if (path.parse(obj.name).name === filenameWithoutExt) {
        exists = true;
        break;
      }
    }

    return NextResponse.json({ exists });
  } catch (error: any) {
    console.error("Error checking file existence:", error);
    return NextResponse.json(
      { error: "Error checking file existence" },
      { status: 500 }
    );
  }
}
