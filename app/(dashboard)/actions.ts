'use server';
revalidatePath('/');
import {
  deleteObituaryById,
  getCemeteries,
  getCountries,
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
import { getObituaryCountForFileBox } from '@/app/(dashboard)/setup/actions';

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

  revalidatePath('/');
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

    // Delete the relatives
    await prisma.relative.deleteMany({
      where: { obituaryId: id }
    });

    // Delete the image files from the database
    await prisma.imageFile.deleteMany({
      where: { name: { startsWith: obituary.reference } }
    });

    // Delete the obituary from the database
    await deleteObituaryById(id);
  }

  revalidatePath('/');
}

interface EditObituaryDialogData {
  titles: { id: number; name: string }[];
  cities: {
    id: number;
    name: string | null;
    province: string | null;
    country: { name: string } | null;
  }[];
  cemeteries: {
    id: number;
    name: string;
    city: {
      name: string;
      province: string | null;
      country: { name: string } | null;
    };
  }[];
  periodicals: { id: number; name: string }[];
  fileBoxes: { id: number; year: number; number: number }[];
}

export async function getEditObituaryDialogData(): Promise<EditObituaryDialogData> {
  const [rawTitles, rawCities, rawCemeteries, rawPeriodicals, rawFileBoxes] =
    await Promise.all([
      getTitles(),
      getCities(),
      getCemeteries(),
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
      name: string | null;
      province: string | null;
      country: { name: string } | null;
    } => true
  );

  const cemeteries = rawCemeteries.filter(
    (
      cemetery
    ): cemetery is {
      id: number;
      name: string;
      city: {
        name: string;
        province: string | null;
        country: { name: string } | null;
      };
    } => cemetery.name !== null
  );

  const periodicals = rawPeriodicals.filter(
    (periodical): periodical is { id: number; name: string } =>
      periodical.name !== null
  );

  const fileBoxes = rawFileBoxes.filter(
    (fileBox): fileBox is { id: number; year: number; number: number } =>
      fileBox.year !== null && fileBox.number !== null
  );

  return {
    titles,
    cities,
    cemeteries,
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
export async function obituaryExists(
  surname: string,
  givenNames: string,
  deathDate: Date
): Promise<Obituary[]> {
  const formattedSurname = surname.toUpperCase();
  const formattedGivenNames = givenNames
    .toLowerCase()
    .split(' ')
    .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
    .join(' ');

  const existingObituaries = await prisma.obituary.findMany({
    where: {
      surname: formattedSurname,
      givenNames: formattedGivenNames,
      deathDate: deathDate
    }
  });

  return existingObituaries;
}

export async function createObituaryAction(
  obituaryData: Prisma.ObituaryCreateInput & {
    relatives?: Omit<Prisma.RelativeCreateInput, 'Obituary'>[];
  }
): Promise<Obituary> {
  const { relatives, ...restObituaryData } = obituaryData;

  // Get the open file box ID
  const openFileBoxId = await getOpenFileBoxId();

  // Check how many obituaries are associated with the open file box ID
  const obituaryCount = await getObituaryCountForFileBox(openFileBoxId);

  let fileBoxIdToUse = openFileBoxId;

  // If the count is 950 or more, create a new file box
  if (obituaryCount >= 950) {
    const currentYear = new Date().getFullYear();
    const existingBoxes = await prisma.fileBox.findMany({
      where: { year: currentYear },
      orderBy: { number: 'asc' },
    });

    const newNumber = existingBoxes.length > 0 ? existingBoxes.length + 1 : 1;

    // Create the new file box
    const newFileBox = await prisma.fileBox.create({
      data: {
        year: currentYear,
        number: newNumber,
      },
    });

    fileBoxIdToUse = newFileBox.id; // Use the new file box ID

    // Update the open file box ID in settings
    await prisma.settings.upsert({
      where: { id: 'open_filebox_id' },
      update: { value: newFileBox.id.toString() },
      create: { id: 'open_filebox_id', value: newFileBox.id.toString() },
    });
  }

  // Use a transaction to ensure all operations are performed atomically
  return await prisma.$transaction(async (prisma) => {
    // Create a new obituary record in the database with the determined file box ID
    const newObituary = await prisma.obituary.create({
      data: {
        ...restObituaryData,
        fileBoxId: fileBoxIdToUse,
        cemetery: undefined,
        birthCity: undefined,
        deathCity: undefined,
        periodical: undefined,
        title: undefined,
        fileBox: undefined,
      },
    });

    // Extract the generated id from the new obituary record
    const { id: newObituaryId } = newObituary;

    // If there are relatives, create them and associate them with the new obituary
    if (relatives && relatives.length > 0) {
      await prisma.relative.createMany({
        data: relatives.map((relative) => ({
          obituaryId: newObituaryId,
          ...relative,
        })),
      });
    }

    // Fetch the final obituary record with the associated relatives
    const finalObituary = await prisma.obituary.findUnique({
      where: { id: newObituaryId },
      include: { relatives: true },
    });

    // Revalidate the path to update the cache
    revalidatePath('/');
    return finalObituary!;
  });
}

type ObituaryUpdateInput = Prisma.ObituaryUpdateInput & {
  relatives?: Prisma.RelativeCreateInput[];
  alsoKnownAs?: Prisma.AlsoKnownAsCreateInput[];
};

export async function updateObituaryAction(
  id: number,
  obituaryData: Omit<ObituaryUpdateInput, 'relatives' | 'alsoKnownAs'>,
  relatives: Omit<Prisma.RelativeCreateManyInput[], 'obituaryId'>,
  alsoKnownAs: Omit<Prisma.AlsoKnownAsCreateManyInput[], 'obituaryId'>
): Promise<
  Prisma.ObituaryGetPayload<{ include: { relatives: true; alsoKnownAs: true } }>
> {
  const updatedObituaryWithRelations = await prisma.$transaction(
    async (prisma) => {
      // Update the obituary
      const updatedObituary = await prisma.obituary.update({
        where: { id },
        data: obituaryData,
        include: { relatives: true, alsoKnownAs: true }
      });

      // Delete existing relatives
      await prisma.relative.deleteMany({
        where: { obituaryId: id }
      });

      // Create new relatives if any
      if (relatives && relatives.length > 0) {
        await prisma.relative.createMany({
          data: relatives.map((relative) => ({
            ...relative,
            obituaryId: id
          }))
        });
      }

      // Delete existing AKAs
      await prisma.alsoKnownAs.deleteMany({
        where: { obituaryId: id }
      });

      // Create new AKAs if any
      if (alsoKnownAs && alsoKnownAs.length > 0) {
        await prisma.alsoKnownAs.createMany({
          data: alsoKnownAs.map((aka) => ({
            ...aka,
            obituaryId: id
          }))
        });
      }

      // Fetch the updated obituary with new relations
      const finalObituary = await prisma.obituary.findUnique({
        where: { id },
        include: { relatives: true, alsoKnownAs: true }
      });

      return finalObituary;
    }
  );

  revalidatePath('/');
  return updatedObituaryWithRelations!;
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

// If obituary exists, generate new file number adding a letter at the end
export async function generateNewFileNumber(
  surname: string,
  givenNames: string,
  deathDate: Date
): Promise<string> {
  const existingObituary = await prisma.obituary.findFirst({
    where: {
      surname: surname.toUpperCase(),
      givenNames: givenNames
        .toLowerCase()
        .split(' ')
        .map((name) => name.charAt(0).toUpperCase() + name.slice(1))
        .join(' '),
      deathDate
    }
  });

  if (!existingObituary) {
    return await generateReference(surname);
  }

  const baseReference = existingObituary.reference.slice(0, 8); // Ensure we only use the first 8 characters

  const imageFiles = await prisma.imageFile.findMany({
    where: {
      name: {
        startsWith: baseReference
      }
    }
  });

  const imageFileExists = imageFiles.length > 0;

  if (!imageFileExists) {
    return `${baseReference}`;
  }

  if (imageFiles.length === 1 && imageFiles[0].name.length === 8) {
    return `${baseReference}a`;
  }

  const suffixes = imageFiles
    .map((file) => file.name.slice(8))
    .filter((suffix) => suffix.match(/^[a-z]$/));

  const lastSuffix = suffixes.sort().pop()!;
  const nextSuffix = String.fromCharCode(lastSuffix.charCodeAt(0) + 1);

  return `${baseReference}${nextSuffix}`;
}

// Create new image file
export async function createImageFileAction(name: string) {
  const newImageFile = await prisma.imageFile.create({
    data: { name }
  });

  revalidatePath('/');
  return newImageFile.name;
}

export async function getOpenFileBoxId(): Promise<number> {
  const setting = await prisma.settings.findUnique({
    where: {
      id: 'open_filebox_id'
    }
  });

  return setting ? parseInt(setting.value) : 0;
}
