'use server';

import { deleteImageFileReference, updateImageFileReference } from '@/lib/db';
import minioClient from '@/lib/minio-client';
import { prisma } from '@/lib/prisma';
import { BucketItem } from 'minio';
import { revalidatePath } from 'next/cache';

interface SortableBucketItem {
  name?: string;
  prefix?: string;
  size: number;
  etag: string;
  lastModified?: Date;
  sortKey: string | number;
}

export async function fetchImagesAction(
  cursor: string | null,
  limit: number,
  search: string,
  orderBy:
    | 'fileNameAsc'
    | 'fileNameDesc'
    | 'lastModifiedAsc'
    | 'lastModifiedDesc'
) {
  try {
    const images = await prisma.image.findMany({
      where: search
        ? {
            name: { contains: search, mode: 'insensitive' }
          }
        : undefined,
      orderBy: {
        name: orderBy.includes('fileName')
          ? orderBy.includes('Desc')
            ? 'desc'
            : 'asc'
          : undefined,
        lastModified: !orderBy.includes('fileName')
          ? orderBy.includes('Desc')
            ? 'desc'
            : 'asc'
          : undefined
      },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { name: cursor } : undefined
    });

    const hasMore = images.length === limit;

    return {
      images: images.map((img) => ({
        name: img.name,
        size: img.size,
        lastModified: img.lastModified,
        etag: img.etag,
        prefix: img.prefix || undefined
      })),
      hasMore,
      nextCursor: hasMore ? images[images.length - 1].name : null
    };
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
}

export async function deleteImageAction(fileName: string) {
  try {
    await minioClient.removeObject(process.env.MINIO_BUCKET_NAME!, fileName);
    await prisma.image.delete({ where: { name: fileName } });
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error(
      `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getImageUrlAction(fileName: string) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    return await minioClient.presignedGetObject(
      bucketName,
      fileName,
      24 * 60 * 60
    );
  } catch (error) {
    console.error('Error getting image URL:', error);
    throw new Error(
      `Failed to get image URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function rotateImageAction(fileName: string) {
  try {
    // Fetch the current image record from the database
    const image = await prisma.image.findUnique({
      where: { name: fileName },
    });

    if (!image) {
      throw new Error(`Image not found: ${fileName}`);
    }

    // Calculate the new rotation value
    const newRotation = (image?.rotation! + 90) % 360;

    // Update the image record with the new rotation value
    await prisma.image.update({
      where: { name: fileName },
      data: { rotation: newRotation },
    });

    
  } catch (error) {
    console.error('Error rotating image:', error);
    throw new Error(
      `Failed to rotate image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function renameImageAction(oldName: string, newName: string) {
  try {
    await minioClient.copyObject(
      process.env.MINIO_BUCKET_NAME!,
      newName,
      `${process.env.MINIO_BUCKET_NAME!}/${oldName}`
    );
    await minioClient.removeObject(process.env.MINIO_BUCKET_NAME!, oldName);
    
    await prisma.image.update({
      where: { name: oldName },
      data: { name: newName }
    });
  } catch (error) {
    console.error('Error renaming image:', error);
    throw new Error(
      `Failed to rename image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
// After uploading images, update the image file references
export async function uploadImagesAction(
  files: { name: string; type: string; arrayBuffer: ArrayBuffer }[]
) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    for (const file of files) {
      const uploadResponse = await minioClient.putObject(
        bucketName,
        file.name,
        Buffer.from(file.arrayBuffer)
      );

      const size = file.arrayBuffer.byteLength;
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
      } else {
        throw new Error(`No obituary found for reference: ${reference}`);
      }
    }
  } catch (error) {
    console.error('Error uploading images to Minio:', error);
    throw new Error(
      `Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Add this new sync function
export async function syncMinioWithDatabase() {
  try {
    const stream = minioClient.listObjects(process.env.MINIO_BUCKET_NAME!, '', true);
    const minioFiles: BucketItem[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (obj) => {
        console.log('Received object:', obj);
        if (obj.name) {
          minioFiles.push(obj);
        }
      });
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        reject(err); // Reject the promise on stream error
      });
      stream.on('end', () => {
        console.log('Stream ended. Total files:', minioFiles.length);
        resolve(); // Resolve the promise when the stream ends
      });
    });

    // Process files in batches
    const batchSize = 10; // Adjust batch size as needed
    for (let i = 0; i < minioFiles.length; i += batchSize) {
      const batch = minioFiles.slice(i, i + batchSize);
      await prisma.$transaction(async (tx) => {
        const upsertPromises = batch.map(file => {
          if (file.etag !== undefined) {
            const dataToInsert = {
              name: file.name!,
              size: file.size,
              lastModified: file.lastModified!,
              etag: file.etag || '',
              prefix: file.prefix || null
            };

            console.log('Preparing to upsert file:', dataToInsert); // Log each file being processed

            return tx.image.upsert({
              where: { name: dataToInsert.name }, // Assuming 'name' is the unique identifier
              create: dataToInsert,
              update: dataToInsert,
            });
          }
          return Promise.resolve(); // Return a resolved promise for files without etag
        });

        // Wait for all upsert operations to complete
        await Promise.all(upsertPromises);
      });

      // Introduce a delay between transactions to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay for 2 seconds (2000 milliseconds)
    }
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}
