'use server';

import minioClient from '@/lib/minio-client';
import { BucketItem, BucketStream } from 'minio';
import { revalidatePath } from 'next/cache';

export async function fetchImagesAction(
  cursor: string | null,
  limit: number,
  searchQuery: string = ''
) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }

    const prefix = searchQuery.toUpperCase();
    const objects: BucketItem[] = [];
    
    let hasMore = false;
    let nextCursor: string | undefined = undefined;

    // Now, get the paginated results
    const stream: BucketStream<BucketItem> = minioClient.listObjectsV2(bucketName, prefix, true, cursor ?? undefined);

    for await (const obj of stream) {
      if (obj.name?.toLowerCase().startsWith(searchQuery.toLowerCase())) {
        objects.push(obj);
        if (objects.length >= limit + 1) {
          hasMore = true;
          nextCursor = obj.name;
          break;
        }
      }
    }

    // Remove the extra item used to determine if there are more results
    if (hasMore) {
      objects.pop();
    }

    return {
      images: objects,
      hasMore,
      nextCursor
    };
  } catch (error) {
    console.error('Error connecting to Minio:', error);
    throw new Error(`Minio connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteImageAction(fileName: string) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    await minioClient.removeObject(bucketName, fileName);
    revalidatePath('/');
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getImageUrlAction(fileName: string) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    return await minioClient.presignedGetObject(bucketName, fileName, 24 * 60 * 60);
  } catch (error) {
    console.error('Error getting image URL:', error);
    throw new Error(`Failed to get image URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function rotateImageAction(fileName: string, degrees: number) {
  // Implement image rotation logic here
  // This might involve downloading the image, rotating it, and re-uploading it
  // You may need to use a library like 'sharp' for image manipulation
  console.log(`Rotating image ${fileName} by ${degrees} degrees`);
  revalidatePath('/');
}

export async function renameImageAction(oldName: string, newName: string) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    // Copy the object to the new name
    await minioClient.copyObject(bucketName, newName, `/${bucketName}/${oldName}`);
    // Remove the old object
    await minioClient.removeObject(bucketName, oldName);
    revalidatePath('/');
  } catch (error) {
    console.error('Error renaming image:', error);
    throw new Error(`Failed to rename image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function uploadImagesAction(files: { name: string; type: string; arrayBuffer: ArrayBuffer }[]) {
  console.log('Uploading images:', files);
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    for (const file of files) {
      await minioClient.putObject(bucketName, file.name, Buffer.from(file.arrayBuffer));
    }
    revalidatePath('/');
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}