'use server';

import { ImageWithObituary } from '@/lib/db';
import minioClient from '@/lib/minio-client';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { BucketItem } from 'minio';
import { updateObituaryImageNames } from '../actions';
import { OrderField } from './image-table'; // Adjust the path as necessary

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
  imagesPerPage: number,
  searchQuery: string,
  orderBy: OrderField,
  obituaryFilter: 'all' | 'has' | 'no'
): Promise<{
  images: ImageWithObituary[];
  hasMore: boolean;
  nextCursor: string | null;
}> {
  const query = {
    where: {
      ...(searchQuery && { name: { contains: searchQuery } }),
      ...(obituaryFilter === 'has' && { obituary: { is: {} } }),
      ...(obituaryFilter === 'no' && { obituary: null })
    },
    take: imagesPerPage,
    ...(cursor && { skip: 1 }), // Skip the cursor if provided
    orderBy: {
      name: orderBy === 'fileNameAsc' ? 'asc' : 'desc' // Adjust based on your ordering logic
    },
    include: {
      obituary: true // Include the related obituary data
    }
  };

  const images = await prisma.image.findMany(query as Prisma.ImageFindManyArgs);
  const hasMore = images.length === imagesPerPage; // Check if there are more images
  const nextCursor = hasMore ? images[images.length - 1].id : null; // Set the next cursor

  return { images, hasMore, nextCursor };
}

export async function deleteImageAction(fileName: string) {
  try {
    await minioClient.removeObject(process.env.MINIO_BUCKET_NAME!, fileName);
    await prisma.image.delete({ where: { name: fileName } });
    // Get the obituary reference from the image name (first 8 characters)
    const reference = fileName.slice(0, 8);

    // Find the obituary and update its imageNames
    const obituary = await prisma.obituary.findFirst({
      where: { reference }
    });

    if (obituary) {
      await updateObituaryImageNames(obituary.id);
    }
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
      where: { name: fileName }
    });

    if (!image) {
      throw new Error(`Image not found: ${fileName}`);
    }

    // Calculate the new rotation value
    const newRotation = (image?.rotation! + 90) % 360;

    // Update the image record with the new rotation value
    await prisma.image.update({
      where: { name: fileName },
      data: { rotation: newRotation }
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
// After uploading images, update the image table and the obituary imagesNames property
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
        await updateObituaryImageNames(obituary.id);
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
    const stream = minioClient.listObjects(
      process.env.MINIO_BUCKET_NAME!,
      '',
      true
    );
    const minioFiles: BucketItem[] = [];

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (obj: any) => {
        console.log('Received object:', obj);
        if (obj.name) {
          minioFiles.push(obj as BucketItem);
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
        const upsertPromises = batch.map((file) => {
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
              update: dataToInsert
            });
          }
          return Promise.resolve(); // Return a resolved promise for files without etag
        });

        // Wait for all upsert operations to complete
        await Promise.all(upsertPromises);
      });

      // Introduce a delay between transactions to avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay for 2 seconds (2000 milliseconds)
    }
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}

export async function getEtag(fileName: string): Promise<string> {
  try {
    const bucketName = process.env.MINIO_BUCKET_NAME!;
    const statObject = await minioClient.statObject(bucketName, fileName);
    return statObject.etag; // Return the ETag from the object's metadata
  } catch (error) {
    console.error('Error fetching ETag:', error);
    throw new Error('Failed to fetch ETag for the image');
  }
}
