'use server';

import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

export type Obituary = Awaited<ReturnType<typeof prisma.obituary.findUnique>> & {
  relatives?: Awaited<ReturnType<typeof prisma.relative.findMany>>;
};

export async function getObituaries(
  search: string,
  offset: number,
  limit: number = 10
): Promise<{
  obituaries: Obituary[];
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
      take: limit,
      skip: offset,
      orderBy: { reference: 'asc' },
      include: {
        relatives: true,
      },
    }),
    prisma.obituary.count({ where }),
  ]);

  return {
    obituaries,
    totalObituaries,
  };
}

// export async function deleteObituaryById(id: number) {
//   await prisma.obituary.delete({ where: { id } });
// }

export async function deleteObituaryById(id: number) {
  await prisma.$transaction(async (prisma) => {
    // Delete all relatives associated with the obituary
    await prisma.relative.deleteMany({
      where: { obituaryId: id }
    });

    // Delete the obituary
    await prisma.obituary.delete({
      where: { id }
    });
  });
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
    relatives,
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
      relatives: {
        deleteMany: {},
        create: relatives,
      },
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

export async function getCemeteries() {
  return prisma.cemetery.findMany({
    select: {
      id: true,
      name: true,
      city: {
        select: {
          name: true,
          province: true,
          country: {
            select: {
              name: true,
            },
          },
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

// Get user role
export async function getUserRole() {
  const { userId } = auth();
  const genealogist = await prisma.genealogist.findUnique({
    where: { clerkId: userId! },
    select: { role: true },
  });
  const role = genealogist?.role!;

  return role;
}

// Get current user full name
export async function getUserFullName() {
  const { userId } = auth();
  const genealogist = await prisma.genealogist.findUnique({
    where: { clerkId: userId! },
    select: { fullName: true },
  });
  const fullName = genealogist?.fullName!;

  return fullName;
}

// Get current user
export async function getUserData() {
  const { userId } = auth();
  const userData = await prisma.genealogist.findUnique({
    where: { clerkId: userId! },
    select: { fullName: true, role: true },
  });

  return userData;
}