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
import { deleteImageAction } from './images/minio-actions';
import { fetchImagesForObituaryAction } from './obituary/[reference]/actions';

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

// Function to check if a obituary with the same surname, given names, and death date exists, return true if it does, false if it doesn't
export async function obituaryExists(surname: string, givenNames: string, deathDate: Date): Promise<boolean> {
  const formattedSurname = surname.toUpperCase();
  const formattedGivenNames = givenNames.toLowerCase().split(' ').map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(' ');

  const existingObituaries = await prisma.obituary.findMany({
    where: {
      surname: formattedSurname,
      givenNames: formattedGivenNames,
      deathDate: deathDate
    }
  });

  return existingObituaries.length > 0;
}

export async function createObituaryAction(
  obituaryData: Prisma.ObituaryCreateInput & {
    relatives?: Omit<Prisma.RelativeCreateInput, 'Obituary'>[];
  }
): Promise<Obituary> {
  const { relatives, ...restObituaryData } = obituaryData;

  // Use a transaction to ensure all operations are performed atomically
  return await prisma.$transaction(async (prisma) => {
    // Reset the ID sequence to the maximum existing ID
    await prisma.$executeRaw`SELECT setval('obituary_id_seq', COALESCE((SELECT MAX(id) FROM "Obituary"), 1));`;

    // Create a new obituary record in the database
    const newObituary = await prisma.obituary.create({
      data: { ...restObituaryData }
    });

    // Extract the generated id from the new obituary record
    const { id: newObituaryId } = newObituary;

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
    const finalObituary = await prisma.obituary.findUnique({
      where: { id: newObituaryId },
      include: { relatives: true }
    });

    // Revalidate the path to update the cache
    revalidatePath('/');
    return finalObituary!;
  });
}

type ObituaryUpdateInput = Prisma.ObituaryUpdateInput & {
  relatives?: Prisma.RelativeCreateInput[];
};

export async function updateObituaryAction(
  id: number,
  obituaryData: Omit<ObituaryUpdateInput, 'relatives'>,
  relatives: Omit<Prisma.RelativeCreateManyInput[], 'obituaryId'>
): Promise<Prisma.ObituaryGetPayload<{ include: { relatives: true } }>> {
  const updatedObituaryWithRelatives = await prisma.$transaction(
    async (prisma) => {
      // Update the obituary
      const updatedObituary = await prisma.obituary.update({
        where: { id },
        data: obituaryData,
        include: { relatives: true }
      });

      if (relatives.length > 0) {
        // Delete existing relatives
        const resetRelatives = await prisma.relative.deleteMany({
          where: { obituaryId: id }
        });

        // Create new relatives
        if (resetRelatives) {
          await prisma.relative.createMany({
            data: relatives.map((relative) => ({
              ...relative,
              obituaryId: id
            }))
          });
        }
      }

      // Fetch the updated obituary with new relatives
      return prisma.obituary.findUnique({
        where: { id },
        include: { relatives: true }
      });
    }
  );

  revalidatePath('/');
  return updatedObituaryWithRelatives!;
}

export async function deleteRelativeAction(relativeId: number) {
  await prisma.relative.delete({
    where: { id: relativeId }
  });
  revalidatePath('/');
}

export async function addTitle(name: string) {
  return prisma.$transaction(async (prisma) => {
    await prisma.$executeRaw`SELECT setval('title_id_seq', COALESCE((SELECT MAX(id) FROM "Title"), 1));`;
    const newTitle = await prisma.title.create({
      data: { name }
    });
    revalidatePath('/');
    return newTitle;
  });
}

export async function addCity(name: string) {
  return prisma.$transaction(async (prisma) => {
    await prisma.$executeRaw`SELECT setval('city_id_seq', COALESCE((SELECT MAX(id) FROM "City"), 1));`;
    const newCity = await prisma.city.create({
      data: { name }
    });
    revalidatePath('/');
    return newCity;
  });
}

export async function addPeriodical(name: string) {
  return prisma.$transaction(async (prisma) => {
    await prisma.$executeRaw`SELECT setval('periodical_id_seq', COALESCE((SELECT MAX(id) FROM "Periodical"), 1));`;
    const newPeriodical = await prisma.periodical.create({
      data: { name }
    });
    revalidatePath('/');
    return newPeriodical;
  });
}

export async function addFileBox(year: number, number: number) {
  return prisma.$transaction(async (prisma) => {
    await prisma.$executeRaw`SELECT setval('filebox_id_seq', COALESCE((SELECT MAX(id) FROM "FileBox"), 1));`;
    const newFileBox = await prisma.fileBox.create({
      data: { year, number }
    });
    revalidatePath('/');
    return newFileBox;
  });
}
