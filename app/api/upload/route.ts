import { NextResponse } from 'next/server';
import { uploadImagesAction } from '@/app/(dashboard)/images/minio-actions';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    const fileData = await Promise.all(
      files.map(async (file) => {
        const fileNameParts = file.name.split('.');
        const extension = fileNameParts.pop();
        const fileName = fileNameParts.join('.').toUpperCase();
        const newFileName = `${fileName}.${extension}`;

        return {
          name: newFileName,
          type: file.type,
          arrayBuffer: await file.arrayBuffer(),
        };
      })
    );

    await uploadImagesAction(fileData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}