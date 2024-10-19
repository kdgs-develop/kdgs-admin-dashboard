import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'minio';
import { Readable } from 'stream';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT!),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME!;
const MAX_RETRIES = 3;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  try {
    await uploadFile(file);
    return NextResponse.json({ message: `Successfully uploaded ${file.name}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

async function uploadFile(file: File): Promise<void> {
  const fileBuffer = await file.arrayBuffer();
  const fileStream = Readable.from(Buffer.from(fileBuffer));

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      await minioClient.putObject(
        BUCKET_NAME,
        file.name,
        fileStream,
        file.size,
        { 'Content-Type': file.type }
      );
      return;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed for ${file.name}:`, error);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error(`Failed to upload ${file.name} after ${MAX_RETRIES} attempts`);
      }
    }
  }
}