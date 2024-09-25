'use server';

import minioClient from '@/lib/minio-client';
import { BucketItem } from 'minio';
import { revalidatePath } from 'next/cache';

export async function fetchImagesAction(
  page: number = 1,
  limit: number = 5,
  searchQuery: string = '',
  sortBy: 'name' | 'lastModified' = 'name'
) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    console.log('Attempting to connect to Minio:', process.env.MINIO_ENDPOINT);

    const bucketExists = await minioClient.bucketExists(bucketName);
    console.log('Bucket exists:', bucketExists);

    if (!bucketExists) {
      throw new Error(`Bucket "${bucketName}" does not exist`);
    }

    const objects: BucketItem[] = [];
    const stream = minioClient.listObjects(bucketName, '', true);

    await new Promise((resolve, reject) => {
      stream.on('data', (obj) => objects.push(obj));
      stream.on('error', reject);
      stream.on('end', resolve);
    });

    console.log('Objects fetched:', objects.length);

    // Filter objects based on the search query
    let filteredObjects = objects.filter((obj) =>
      obj.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort the filtered objects
    filteredObjects.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name ?? '').localeCompare(b.name ?? '');
      } else if (sortBy === 'lastModified') {
        const dateA = a.lastModified?.getTime() ?? 0;
        const dateB = b.lastModified?.getTime() ?? 0;
        return dateB - dateA; // Sort in descending order (most recent first)
      }
      return 0;
    });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedObjects = filteredObjects.slice(startIndex, endIndex);

    return {
      images: paginatedObjects,
      total: filteredObjects.length
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

export async function uploadImagesAction(files: File[]) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    for (const file of files) {
      const buffer = await file.arrayBuffer();
      await minioClient.putObject(bucketName, file.name, Buffer.from(buffer));
    }
    revalidatePath('/');
  } catch (error) {
    console.error('Error uploading images:', error);
    throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}