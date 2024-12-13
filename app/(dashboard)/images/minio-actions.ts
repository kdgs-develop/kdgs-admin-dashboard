'use server';

import { deleteImageFileReference, updateImageFileReference } from '@/lib/db';
import minioClient from '@/lib/minio-client';
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
  orderBy: 'fileNameAsc' | 'fileNameDesc' | 'lastModifiedAsc' | 'lastModifiedDesc'
) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  
  try {
    const stream = minioClient.listObjects(bucketName, '', true);
    let images: BucketItem[] = [];

    await new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name && (!search || obj.name.toLowerCase().includes(search.toLowerCase()))) {
          images.push(obj);
        }
      });
      stream.on('error', reject);
      stream.on('end', resolve);
    });

    // Simple sort based on orderBy
    images.sort((a, b) => {
      const aValue = orderBy.includes('fileName') ? a.name : a.lastModified?.getTime();
      const bValue = orderBy.includes('fileName') ? b.name : b.lastModified?.getTime();
      return orderBy.includes('Desc') ? 
        (bValue > aValue ? 1 : -1) : 
        (aValue > bValue ? 1 : -1);
    });

    const startIndex = cursor ? images.findIndex(img => img.name === cursor) + 1 : 0;
    const paginatedImages = images.slice(startIndex, startIndex + limit);

    return {
      images: paginatedImages,
      hasMore: startIndex + limit < images.length,
      nextCursor: paginatedImages.length > 0 ? paginatedImages[paginatedImages.length - 1].name : null
    };

  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
}

export async function deleteImageAction(fileName: string) {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    await minioClient.removeObject(bucketName, fileName);
    await deleteImageFileReference(fileName);
    revalidatePath('/');
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
    await minioClient.copyObject(
      bucketName,
      newName,
      `/${bucketName}/${oldName}`
    );
    // Remove the old object
    await minioClient.removeObject(bucketName, oldName);
    revalidatePath('/');
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
  console.log(
    'Uploading images to Minio:',
    files.map((f) => f.name)
  );
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  try {
    for (const file of files) {
      await minioClient.putObject(
        bucketName,
        file.name,
        Buffer.from(file.arrayBuffer)
      );
      console.log('Uploaded file:', file.name);
      // Update the image file reference, extension, and size
      const extension = file.name.split('.').pop()!;
      const size = file.arrayBuffer.byteLength;
      await updateImageFileReference(file.name, extension, size);
    }
    revalidatePath('/');
  } catch (error) {
    console.error('Error uploading images to Minio:', error);
    throw new Error(
      `Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
