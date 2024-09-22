import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

export type Obituary = Awaited<ReturnType<typeof prisma.obituary.findUnique>>;

export async function getObituaries(
  search: string,
  offset: number
): Promise<{
  obituaries: Obituary[];
  newOffset: number | null;
  totalObituaries: number;
}> {
  const where: Prisma.ObituaryWhereInput = search
    ? {
        OR: [
          {
            surname: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            givenNames: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            reference: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }
    : {};

  const [obituaries, totalObituaries] = await Promise.all([
    prisma.obituary.findMany({
      where,
      take: 5,
      skip: offset,
      orderBy: { reference: 'asc' },
    }),
    prisma.obituary.count({ where }),
  ]);

  const newOffset = obituaries.length === 5 ? offset + 5 : null;

  return {
    obituaries,
    newOffset,
    totalObituaries,
  };
}

export async function deleteObituaryById(id: number) {
  await prisma.obituary.delete({ where: { id } });
}

export async function updateObituary(obituaryData: Partial<Obituary> & { id: number }): Promise<Obituary> {
  const {
    id,
    reference,
    surname,
    titleId,
    givenNames,
    maidenName,
    birthDate,
    birthCityId,
    deathDate,
    deathCityId,
    burialCemetery,
    cemeteryId,
    place,
    periodicalId,
    publishDate,
    page,
    column,
    notes,
    proofread,
    proofreadDate,
    proofreadBy,
    enteredBy,
    enteredOn,
    editedBy,
    editedOn,
    fileBoxId,
  } = obituaryData;

  const updatedObituary = await prisma.obituary.update({
    where: { id },
    data: {
      reference,
      surname,
      titleId,
      givenNames,
      maidenName,
      birthDate,
      birthCityId,
      deathDate,
      deathCityId,
      burialCemetery,
      cemeteryId,
      place,
      periodicalId,
      publishDate,
      page,
      column,
      notes,
      proofread,
      proofreadDate,
      proofreadBy,
      enteredBy,
      enteredOn,
      editedBy,
      editedOn,
      fileBoxId,
    },
  });

  return updatedObituary;
}

export async function getTitles() {
  return prisma.title.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getCities() {
  return prisma.city.findMany({
    select: {
      id: true,
      name: true,
      province: true,
      country: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getPeriodicals() {
  return prisma.periodical.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

export async function getFileBoxes() {
  return prisma.fileBox.findMany({
    select: {
      id: true,
      year: true,
      number: true,
    },
    orderBy: [
      {
        year: 'desc',
      },
      {
        number: 'asc',
      },
    ],
  });
}