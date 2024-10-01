'use server';
revalidatePath('/');
import {
  deleteObituaryById,
  getCities,
  getFileBoxes,
  getObituaries,
  getPeriodicals,
  getTitles,
  Obituary
} from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { fetchImagesForObituaryAction } from './obituary/[reference]/actions';
import { deleteImageAction } from './images/minio-actions';

export async function fetchObituariesAction(
  offset: number = 0,
  limit: number = 5,
  search: string = ''
) {
  'use server';
  const { obituaries, totalObituaries } = await getObituaries(
    search,
    offset,
    limit
  );
  return { obituaries, total: totalObituaries };
}

export async function deleteObituary(formData: FormData) {
  const id = Number(formData.get('id'));
  
  // Fetch the obituary to get the reference
  const obituary = await prisma.obituary.findUnique({ where: { id } });
  
  if (obituary) {
    // Fetch images associated with the obituary
    const images = await fetchImagesForObituaryAction(obituary.reference);
    
    // Delete each image from Minio
    for (const image of images) {
      await deleteImageAction(image);
    }
    
    // Delete the obituary from the database
    await deleteObituaryById(id);
  }
  
  revalidatePath('/');
}

interface EditObituaryDialogData {
  titles: { id: number; name: string }[];
  cities: {
    id: number;
    name: string;
    province: string | null;
    country: { name: string } | null;
  }[];
  periodicals: { id: number; name: string }[];
  fileBoxes: { id: number; year: number; number: number }[];
}

export async function getEditObituaryDialogData(): Promise<EditObituaryDialogData> {
  const [rawTitles, rawCities, rawPeriodicals, fileBoxes] = await Promise.all([
    getTitles(),
    getCities(),
    getPeriodicals(),
    getFileBoxes()
  ]);

  const titles = rawTitles.filter(
    (title): title is { id: number; name: string } => title.name !== null
  );

  const cities = rawCities.filter(
    (
      city
    ): city is {
      id: number;
      name: string;
      province: string | null;
      country: { name: string } | null;
    } => city.name !== null
  );

  const periodicals = rawPeriodicals.filter(
    (periodical): periodical is { id: number; name: string } =>
      periodical.name !== null
  );

  return {
    titles,
    cities,
    periodicals,
    fileBoxes
  };
}

export async function generateReference(surname: string): Promise<string> {
  const prefix = surname.slice(0, 4).toUpperCase();
  const latestObituary = await prisma.obituary.findFirst({
    where: {
      reference: {
        startsWith: prefix
      }
    },
    orderBy: {
      reference: 'desc'
    }
  });

  let suffix = '0001';
  if (latestObituary) {
    const latestNumber = parseInt(latestObituary.reference.slice(-4));
    suffix = (latestNumber + 1).toString().padStart(4, '0');
  }

  return `${prefix}${suffix}`;
}

export async function createObituaryAction(
  obituaryData: Prisma.ObituaryCreateInput & {
    relatives?: Omit<Prisma.RelativeCreateInput, 'Obituary'>[];
  }
): Promise<Obituary> {
  // Destructure relatives from obituaryData, leaving the rest of the data in restObituaryData
  const { relatives, ...restObituaryData } = obituaryData;

  // Create a new obituary record in the database
  const newObituary = await prisma.obituary.create({
    data: { ...restObituaryData }
  });

  // Extract the generated id from the new obituary record
  const { id: newObituaryId } = newObituary;
  console.log({ newObituaryId });
  console.log({ relatives });
  console.log({ newObituary });

  // If there are relatives, create them and associate them with the new obituary
  if (relatives && relatives.length > 0) {
    await prisma.relative.createMany({
      data: relatives.map((relative) => ({
        obituaryId: newObituaryId,
        ...relative
      }))
    });
  }

  // Fetch the final obituary record with the associated relatives
  const finalObituary: Obituary | null = await prisma.obituary.findUnique({
    where: { id: newObituaryId }
  });

  // Revalidate the path to update the cache
  revalidatePath('/');
  return finalObituary!;
}

export async function updateObituaryAction(obituaryData: any): Promise<any> {
  const { id, relatives, ...updateData } = obituaryData;

  if (!id) {
    throw new Error('Obituary ID is required for updating');
  }

  await prisma.$transaction(async (prisma) => {
    await prisma.obituary.update({
      where: { id },
      data: {
        ...updateData,
        relatives: {
          deleteMany: {}
        }
      }
    });
    console.log("Relatives deleted")

    if (relatives && relatives.length > 0) {
      await prisma.relative.createMany({
        data: relatives.map((relative: any) => ({
          obituaryId: id,
          ...relative
        }))
      });
    }
  });

  const finalObituary = await prisma.obituary.findUnique({
    where: { id },
    include: { relatives: true }
  });

  revalidatePath('/');
  return finalObituary;
}

export async function deleteRelativeAction(relativeId: number) {
  await prisma.relative.delete({
    where: { id: relativeId }
  });
  revalidatePath('/');
}
