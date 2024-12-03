'use server';

import minioClient from '@/lib/minio-client';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { notFound } from "next/navigation";

type ObituaryWithRelations = Prisma.ObituaryGetPayload<{
  include: {
    title: true;
    cemetery: true;
    periodical: true;
    fileBox: true;
    relatives: true;
    alsoKnownAs: true;
    birthCity: {
      include: {
        country: true;
      };
    };
    deathCity: {
      include: {
        country: true;
      };
    };
  };
}>;

export async function fetchObituaryByReferenceAction(
  reference: string
): Promise<ObituaryWithRelations | null> {
  return prisma.obituary.findUnique({
    where: { reference },
    include: {
      title: true,
      cemetery: true,
      periodical: true,
      fileBox: true,
      relatives: true,
      alsoKnownAs: true,
      birthCountry: true,
      birthCity: {
        include: {
          country: true,
        },
      },
      deathCountry: true,
      deathCity: {
        include: {
          country: true,
        },
      },
    },
  });
}

export async function fetchImagesForObituaryAction(
  reference: string
): Promise<string[]> {
  const bucketName = process.env.MINIO_BUCKET_NAME!;
  const stream = minioClient.listObjects(bucketName, reference, true);

  return new Promise((resolve, reject) => {
    const images: string[] = [];
    stream.on('data', (obj) => {
      if (obj.name && obj.name.startsWith(reference)) {
        images.push(obj.name);
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(images));
  });
}

export async function generatePublicHashAction(obituaryId: number): Promise<string> {
  const hash = createHash('sha256')
    .update(`${obituaryId}-${process.env.HASH_SECRET}`)
    .digest('hex');

  // Check if the hash already exists
  const existingHash = await prisma.obituary.findUnique({
    where: { publicHash: hash }
  });

  if (existingHash) {
    return existingHash?.publicHash!;
  }

  await prisma.obituary.update({
    where: { id: obituaryId },
    data: { publicHash: hash }
  });

  return hash;
}

export async function getPublicObituaryByHash(hash: string) {
  console.log('getPublicObituaryByHash', hash);
  if (!hash) return null;

  try {
    const obituary = await prisma.obituary.findUnique({
      where: { 
        publicHash: hash,
      },
      include: {
        title: true,
        birthCity: { 
          include: { 
            country: true 
          } 
        },
        deathCity: { 
          include: { 
            country: true 
          } 
        },
        cemetery: true,
        periodical: true,
        fileBox: true,
        relatives: true,
        alsoKnownAs: true,
      },
    });

    // Log for debugging
    console.log('Fetching obituary with hash:', hash);
    console.log('Found obituary:', obituary ? 'yes' : 'no');

    return obituary;
  } catch (error) {
    console.error('Error in getPublicObituaryByHash:', error);
    throw error; // Let the client handle the error
  }
}