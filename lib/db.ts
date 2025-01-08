'use server';

import { getEtag } from '@/app/(dashboard)/images/minio-actions';
import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

// Helper function to validate dates
function isValidDate(dateString: string): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export type Obituary = Awaited<
  ReturnType<typeof prisma.obituary.findUnique>
> & {
  relatives?: Awaited<ReturnType<typeof prisma.relative.findMany>>;
  fileBox?: Awaited<ReturnType<typeof prisma.fileBox.findUnique>>;
  images?: Awaited<ReturnType<typeof prisma.image.findMany>>;
};

export type ImageWithObituary = Awaited<
  ReturnType<typeof prisma.image.findUnique>
> & {
  obituary?: Awaited<ReturnType<typeof prisma.obituary.findUnique>>;
};

function createBasicSearchConditions(
  search: string
): Prisma.ObituaryWhereInput[] {
  return [
    // Basic fields
    { surname: { contains: search, mode: Prisma.QueryMode.insensitive } },
    { givenNames: { contains: search, mode: Prisma.QueryMode.insensitive } },
    { reference: { contains: search, mode: Prisma.QueryMode.insensitive } },
    { maidenName: { contains: search, mode: Prisma.QueryMode.insensitive } },
    { batch: { contains: search, mode: Prisma.QueryMode.insensitive } },

    // Additional text fields
    { notes: { contains: search, mode: Prisma.QueryMode.insensitive } },
    { place: { contains: search, mode: Prisma.QueryMode.insensitive } },

    // Related locations
    {
      burialCemetery: { contains: search, mode: Prisma.QueryMode.insensitive }
    },
    {
      cemetery: {
        name: { contains: search, mode: Prisma.QueryMode.insensitive }
      }
    },
    {
      birthCity: {
        name: { contains: search, mode: Prisma.QueryMode.insensitive }
      }
    },
    {
      deathCity: {
        name: { contains: search, mode: Prisma.QueryMode.insensitive }
      }
    },

    // Related records
    {
      periodical: {
        name: { contains: search, mode: Prisma.QueryMode.insensitive }
      }
    },
    {
      alsoKnownAs: {
        some: {
          OR: [
            {
              surname: { contains: search, mode: Prisma.QueryMode.insensitive }
            },
            {
              otherNames: {
                contains: search,
                mode: Prisma.QueryMode.insensitive
              }
            }
          ]
        }
      }
    },

    // User fields
    { enteredBy: { contains: search, mode: Prisma.QueryMode.insensitive } },
    { editedBy: { contains: search, mode: Prisma.QueryMode.insensitive } }
  ];
}

function createNameCombinationSearches(
  firstName: string,
  secondName?: string,
  thirdName?: string,
  fourthName?: string
): Prisma.ObituaryWhereInput[] {
  const conditions: Prisma.ObituaryWhereInput[] = [];

  if (firstName && secondName) {
    // Basic name combinations
    conditions.push(
      // Given names + surname
      {
        AND: [
          {
            givenNames: {
              contains: firstName,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            surname: {
              contains: secondName,
              mode: Prisma.QueryMode.insensitive
            }
          }
        ]
      },
      // Surname + given names
      {
        AND: [
          {
            surname: { contains: firstName, mode: Prisma.QueryMode.insensitive }
          },
          {
            givenNames: {
              contains: secondName,
              mode: Prisma.QueryMode.insensitive
            }
          }
        ]
      },
      // Maiden name searches
      {
        AND: [
          {
            givenNames: {
              contains: firstName,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            maidenName: {
              contains: secondName,
              mode: Prisma.QueryMode.insensitive
            }
          }
        ]
      },
      // Partial name matches (for variations/misspellings)
      {
        OR: [
          {
            givenNames: {
              startsWith: firstName,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            surname: {
              startsWith: secondName,
              mode: Prisma.QueryMode.insensitive
            }
          }
        ]
      },
      // Middle name as surname (common in genealogy)
      {
        AND: [
          {
            givenNames: {
              contains: firstName,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            givenNames: {
              contains: secondName,
              mode: Prisma.QueryMode.insensitive
            }
          }
        ]
      }
    );
  }

  // Three name combinations
  if (thirdName) {
    conditions.push(
      // First + middle + surname
      {
        AND: [
          {
            givenNames: {
              contains: `${firstName} ${secondName}`,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            surname: { contains: thirdName, mode: Prisma.QueryMode.insensitive }
          }
        ]
      },
      // First + maiden + married
      {
        AND: [
          {
            givenNames: {
              contains: firstName,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            maidenName: {
              contains: secondName,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            surname: { contains: thirdName, mode: Prisma.QueryMode.insensitive }
          }
        ]
      },
      // Multiple surnames (hyphenated or space-separated)
      {
        surname: {
          contains: `${secondName} ${thirdName}`,
          mode: Prisma.QueryMode.insensitive
        }
      }
    );
  }

  // Four name combinations
  if (fourthName) {
    conditions.push(
      // Two given names + maiden + married
      {
        AND: [
          {
            givenNames: {
              contains: `${firstName} ${secondName}`,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            maidenName: {
              contains: thirdName,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            surname: {
              contains: fourthName,
              mode: Prisma.QueryMode.insensitive
            }
          }
        ]
      },
      // Double-barrelled surnames with variations
      {
        OR: [
          {
            surname: {
              contains: `${thirdName}-${fourthName}`,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            surname: {
              contains: `${thirdName} ${fourthName}`,
              mode: Prisma.QueryMode.insensitive
            }
          }
        ]
      }
    );
  }

  return conditions;
}

function createSpecialSearchCondition(
  keyword: string,
  value: string,
  extra?: string,
  fourth?: string
): Prisma.ObituaryWhereInput | null {
  const specialSearchMap: Record<
    string,
    (
      val: string,
      extra?: string,
      fourth?: string
    ) => Prisma.ObituaryWhereInput | null
  > = {
    '@fileNumber': (val) => ({
      reference: { contains: val, mode: Prisma.QueryMode.insensitive }
    }),
    '@surname': (val) => ({
      surname: { equals: val, mode: Prisma.QueryMode.insensitive }
    }),
    '@givenNames': (val) => ({
      givenNames: { equals: val, mode: Prisma.QueryMode.insensitive }
    }),
    '@maidenName': (val) => ({
      maidenName: { equals: val, mode: Prisma.QueryMode.insensitive }
    }),
    '@birthDate': (val) =>
      isValidDate(val) ? { birthDate: { equals: new Date(val) } } : null,
    '@birthDateFrom': (val, to, fourth) =>
      isValidDate(val) && to === '@birthDateTo' && isValidDate(fourth!)
        ? { birthDate: { gte: new Date(val), lte: new Date(fourth!) } }
        : null,
    '@deathDate': (val) =>
      isValidDate(val) ? { deathDate: { equals: new Date(val) } } : null,
    '@deathDateFrom': (val, to, fourth) =>
      isValidDate(val) && to === '@deathDateTo' && isValidDate(fourth!)
        ? { deathDate: { gte: new Date(val), lte: new Date(fourth!) } }
        : null,
    '@proofread': (val) => ({
      proofread: val.toLowerCase() === 'true'
    }),
    '@images': (val) => ({
      images: val.toLowerCase() === 'true' ? { some: {} } : { none: {} }
    }),
    '@imagesProofread': (val, proofreadVal) => ({
      AND: [
        {
          images: val.toLowerCase() === 'true' ? { some: {} } : { none: {} }
        },
        { proofread: proofreadVal?.toLowerCase() === 'true' }
      ]
    }),
    '@proofreadDate': (val) =>
      isValidDate(val) ? { proofreadDate: { equals: new Date(val) } } : null,
    '@proofreadDateFrom': (val, to, fourth) =>
      isValidDate(val) && to === '@proofreadDateTo' && isValidDate(fourth!)
        ? { proofreadDate: { gte: new Date(val), lte: new Date(fourth!) } }
        : null,
    '@enteredBy': (val) => ({
      enteredBy: { contains: val, mode: Prisma.QueryMode.insensitive }
    }),
    '@editedBy': (val) => ({
      editedBy: { contains: val, mode: Prisma.QueryMode.insensitive }
    }),
    '@enteredOn': (val) =>
      isValidDate(val) ? { enteredOn: { equals: new Date(val) } } : null,
    '@enteredOnFrom': (val, to, fourth) =>
      isValidDate(val) && to === '@enteredOnTo' && isValidDate(fourth!)
        ? { enteredOn: { gte: new Date(val), lte: new Date(fourth!) } }
        : null,
    '@editedOn': (val) =>
      isValidDate(val) ? { editedOn: { equals: new Date(val) } } : null,
    '@editedOnFrom': (val, to, fourth) =>
      isValidDate(val) && to === '@editedOnTo' && isValidDate(fourth!)
        ? { editedOn: { gte: new Date(val), lte: new Date(fourth!) } }
        : null,
    '@aka.surname': (val) => ({
      alsoKnownAs: {
        some: { surname: { contains: val, mode: Prisma.QueryMode.insensitive } }
      }
    }),
    '@aka.otherNames': (val) => ({
      alsoKnownAs: {
        some: {
          otherNames: { contains: val, mode: Prisma.QueryMode.insensitive }
        }
      }
    }),
    '@fileBox': (val, boxNumber) => ({
      AND: [
        { fileBox: { year: { equals: parseInt(val) } } },
        { fileBox: { number: { equals: parseInt(boxNumber || '') } } }
      ]
    }),
    '@batch': (val) => ({
      batch: { contains: val, mode: Prisma.QueryMode.insensitive }
    }),
    '@publishDate': (val) =>
      isValidDate(val) ? { publishDate: { equals: new Date(val) } } : null,
    '@publishDateFrom': (val, to, fourth) =>
      isValidDate(val) && to === '@publishDateTo' && isValidDate(fourth!)
        ? { publishDate: { gte: new Date(val), lte: new Date(fourth!) } }
        : null,
    '@periodical': (val) => ({
      periodical: {
        name: { contains: val, mode: Prisma.QueryMode.insensitive }
      }
    }),
    '@cemetery': (val) => ({
      OR: [
        {
          burialCemetery: { contains: val, mode: Prisma.QueryMode.insensitive }
        },
        {
          cemetery: {
            name: { contains: val, mode: Prisma.QueryMode.insensitive }
          }
        }
      ]
    }),
    '@birthLocation': (val) => ({
      birthCity: {
        name: { contains: val, mode: Prisma.QueryMode.insensitive }
      }
    }),
    '@deathLocation': (val) => ({
      deathCity: {
        name: { contains: val, mode: Prisma.QueryMode.insensitive }
      }
    }),
    '@generalLocation': (val) => ({
      place: { contains: val, mode: Prisma.QueryMode.insensitive }
    })
  };

  return specialSearchMap[keyword]?.(value, extra, fourth) ?? null;
}

export async function getObituaries(
  search: string,
  offset: number,
  limit: number = 10
): Promise<{ obituaries: Obituary[]; totalObituaries: number }> {
  // Split the search string differently to handle date ranges
  const terms = search.split(' ');
  let searchConditions: Prisma.ObituaryWhereInput[] = [];

  if (terms[0].startsWith('@')) {
    // Handle date range searches
    if (terms[0].endsWith('From') && terms.length >= 4) {
      const specialCondition = createSpecialSearchCondition(
        terms[0], // @dateFrom
        terms[1], // start date
        terms[2], // @dateTo
        terms[3] // end date
      );
      if (specialCondition) {
        searchConditions.push(specialCondition);
      }
    } else {
      // Handle regular special searches
      const specialCondition = createSpecialSearchCondition(
        terms[0],
        terms[1],
        terms[2]
      );
      if (specialCondition) {
        searchConditions.push(specialCondition);
      }
    }
  } else {
    // Handle regular search
    const [firstName, secondName, thirdName, fourthName] = terms;
    searchConditions = [
      ...createBasicSearchConditions(search),
      ...createNameCombinationSearches(
        firstName,
        secondName,
        thirdName,
        fourthName
      )
    ];
  }

  const where: Prisma.ObituaryWhereInput = search
    ? { OR: searchConditions }
    : {};

  const [obituaries, totalObituaries] = await Promise.all([
    prisma.obituary.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { reference: 'asc' },
      include: {
        relatives: true,
        fileBox: true,
        images: true
      }
    }),
    prisma.obituary.count({ where })
  ]);

  return { obituaries, totalObituaries };
}

export async function getObituariesGeneratePDF(
  search: string
): Promise<{ obituaries: Partial<Obituary>[] }> {
  // Split the search string differently to handle date ranges
  const terms = search.split(' ');
  let searchConditions: Prisma.ObituaryWhereInput[] = [];

  if (terms[0].startsWith('@')) {
    // Handle date range searches
    if (terms[0].endsWith('From') && terms.length >= 4) {
      const specialCondition = createSpecialSearchCondition(
        terms[0], // @dateFrom
        terms[1], // start date
        terms[2], // @dateTo
        terms[3] // end date
      );
      if (specialCondition) {
        searchConditions.push(specialCondition);
      }
    } else {
      // Handle regular special searches
      const specialCondition = createSpecialSearchCondition(
        terms[0],
        terms[1],
        terms[2]
      );
      if (specialCondition) {
        searchConditions.push(specialCondition);
      }
    }
  } else {
    // Handle regular search
    const [firstName, secondName, thirdName, fourthName] = terms;
    searchConditions = [
      ...createBasicSearchConditions(search),
      ...createNameCombinationSearches(
        firstName,
        secondName,
        thirdName,
        fourthName
      )
    ];
  }

  const where: Prisma.ObituaryWhereInput = search
    ? { OR: searchConditions }
    : {};

  const obituaries = await prisma.obituary.findMany({
    where,
    orderBy: { reference: 'asc' },
    select: {
      reference: true,
      surname: true,
      givenNames: true,
      deathDate: true,
      proofread: true,
      imageNames: true
    }
  });

  return { obituaries };
}

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

export async function updateObituary(
  obituaryData: Partial<Obituary> & { id: number }
): Promise<Obituary> {
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
    relatives
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
        create: relatives
      }
    }
  });

  return updatedObituary;
}

export async function getTitles() {
  return prisma.title.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getCountries() {
  return prisma.country.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: { name: 'asc' }
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
          name: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
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
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getPeriodicals() {
  return prisma.periodical.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getFamilyRelationships() {
  return prisma.familyRelationship.findMany({
    select: {
      id: true,
      name: true,
      category: true
    },
    orderBy: [{ name: 'asc' }]
  });
}

export async function getFileBoxes() {
  return prisma.fileBox.findMany({
    select: {
      id: true,
      year: true,
      number: true
    },
    orderBy: [
      {
        year: 'desc'
      },
      {
        number: 'asc'
      }
    ]
  });
}

// Get user role
export async function getUserRole() {
  const { userId } = auth();
  const genealogist = await prisma.genealogist.findUnique({
    where: { clerkId: userId! },
    select: { role: true }
  });
  const role = genealogist?.role!;

  return role;
}

// Get current user full name
export async function getUserFullName() {
  const { userId } = auth();
  const genealogist = await prisma.genealogist.findUnique({
    where: { clerkId: userId! },
    select: { fullName: true }
  });
  const fullName = genealogist?.fullName!;

  return fullName;
}

// Get current user
export async function getUserData() {
  const { userId } = auth();
  const userData = await prisma.genealogist.findUnique({
    where: { clerkId: userId! },
    select: { fullName: true, role: true }
  });

  return userData;
}

// Update the image file reference, extension, and size
export async function updateImageFileReference(fileName: string, size: number) {
  await prisma.image.upsert({
    where: { name: fileName.split('.')[0] },
    update: { reference: fileName.slice(0, 8), size },
    create: {
      name: fileName.split('.')[0],
      reference: fileName.slice(0, 8),
      etag: '',
      lastModified: new Date(),
      size
    }
  });
  // get new etag and update the image
  const newEtag = await getEtag(fileName);
  await prisma.image.update({
    where: { name: fileName.split('.')[0] },
    data: { etag: newEtag }
  });
}

// Delete the image file reference
export async function deleteImageFileReference(fileName: string) {
  await prisma.image.delete({ where: { name: fileName.split('.')[0] } });
}

// Get the rotation of an image
export async function getImageRotation(fileName: string) {
  const image = await prisma.image.findUnique({ where: { name: fileName } });
  return image?.rotation;
}

// Update the rotation of an image
export async function updateImageRotation(fileName: string, rotation: number) {
  await prisma.image.update({ where: { name: fileName }, data: { rotation } });
}
