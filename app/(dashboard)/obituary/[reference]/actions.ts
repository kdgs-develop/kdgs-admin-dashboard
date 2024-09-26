'use server';

import minioClient from '@/lib/minio-client';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
      birthCity: {
        include: {
          country: true,
        },
      },
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
