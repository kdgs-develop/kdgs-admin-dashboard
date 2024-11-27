'use server';

import { auth } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export type Obituary = Awaited<
  ReturnType<typeof prisma.obituary.findUnique>
> & {
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
  // Extract name and surname from search string
  const [name, surname] = search.split(' ').map((s) => s.trim());
  const [firstName, secondName, thirdName, fourthName] = search
    .split(' ')
    .map((s) => s.trim());
  function isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
  const where: Prisma.ObituaryWhereInput = search
    ? {
        OR: [
          {
            surname: {
              contains: search,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            givenNames: {
              contains: search,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            reference: {
              contains: search,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            maidenName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive
            }
          },
          {
            batch: {
              contains: search,
              mode: Prisma.QueryMode.insensitive
            }
          },
          // search by given names and surname
          {
            AND: [
              {
                givenNames: {
                  contains: name,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                surname: {
                  contains: surname,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          {
            AND: [
              {
                surname: {
                  contains: name, // first element of search string
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                givenNames: {
                  contains: surname, // second element of search string
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          // search by one given names and one maiden name
          {
            AND: [
              {
                givenNames: {
                  contains: name,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                maidenName: {
                  contains: surname,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          {
            AND: [
              {
                maidenName: {
                  contains: name, // first element of search string
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                givenNames: {
                  contains: surname, // second element of search string
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          // search by two given names and surname
          {
            AND: [
              {
                givenNames: {
                  contains: `${firstName} ${secondName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                surname: {
                  contains: `${thirdName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          {
            AND: [
              {
                surname: {
                  contains: `${firstName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                givenNames: {
                  contains: `${secondName} ${thirdName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          // search by two given names and one maiden name
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
                  contains: `${thirdName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          {
            AND: [
              {
                maidenName: {
                  contains: `${firstName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                givenNames: {
                  contains: `${secondName} ${thirdName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          // search by one given name and two maiden names
          {
            AND: [
              {
                givenNames: {
                  contains: `${firstName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                surname: {
                  contains: `${secondName} ${thirdName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          {
            AND: [
              {
                surname: {
                  contains: `${firstName} ${secondName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                givenNames: {
                  contains: `${thirdName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          // search by two given names and two surnames
          {
            AND: [
              {
                givenNames: {
                  contains: `${firstName} ${secondName}`,
                  mode: Prisma.QueryMode.insensitive
                }
              },
              {
                surname: {
                  contains: `${thirdName} ${fourthName} `,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            ]
          },
          // search by alsoKnownAs name
          {
            alsoKnownAs: {
              some: {
                otherNames: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            }
          },
          // search by alsoKnownAs surname
          {
            alsoKnownAs: {
              some: {
                surname: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive
                }
              }
            }
          },
          // search by alsoKnownAs name and surname
          {
            AND: [
              {
                alsoKnownAs: {
                  some: {
                    otherNames: {
                      contains: name,
                      mode: Prisma.QueryMode.insensitive
                    }
                  }
                }
              },
              {
                alsoKnownAs: {
                  some: {
                    surname: {
                      contains: surname,
                      mode: Prisma.QueryMode.insensitive
                    }
                  }
                }
              }
            ]
          },
          // search by alsoKnownAs first name, second name, and thirdName as surname
          {
            AND: [
              {
                alsoKnownAs: {
                  some: {
                    otherNames: {
                      contains: `${firstName} ${secondName}`,
                      mode: Prisma.QueryMode.insensitive
                    }
                  }
                }
              },
              {
                alsoKnownAs: {
                  some: {
                    surname: {
                      contains: `${thirdName}`,
                      mode: Prisma.QueryMode.insensitive
                    }
                  }
                }
              }
            ]
          },
          // search by alsoKnownAs first name as name, and secondName and thirdName as surname
          {
            AND: [
              {
                alsoKnownAs: {
                  some: {
                    otherNames: {
                      contains: `${firstName}`,
                      mode: Prisma.QueryMode.insensitive
                    }
                  }
                }
              },
              {
                alsoKnownAs: {
                  some: {
                    surname: {
                      contains: `${secondName} ${thirdName}`,
                      mode: Prisma.QueryMode.insensitive
                    }
                  }
                }
              }
            ]
          },
          // search by alsoKnownAs first name as name, and secondName and thirdName and fourthName as surname
          {
            AND: [
              {
                alsoKnownAs: {
                  some: {
                    otherNames: {
                      contains: `${firstName} ${secondName}`,
                      mode: Prisma.QueryMode.insensitive
                    }
                  }
                }
              },
              {
                alsoKnownAs: {
                  some: {
                    surname: {
                      contains: `${thirdName} ${fourthName}`,
                      mode: Prisma.QueryMode.insensitive
                    }
                  }
                }
              }
            ]
          },
          // Only include date conditions if search string is a valid date
          ...(isValidDate(search)
            ? [
                // search by death date
                {
                  deathDate: {
                    gte: new Date(search),
                    lte: new Date(search)
                  }
                },
                // search by birth date
                {
                  birthDate: {
                    gte: new Date(search),
                    lte: new Date(search)
                  }
                }
              ]
            : [])
        ]
      }
    : {};

  const [obituaries, totalObituaries] = await Promise.all([
    prisma.obituary.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { reference: 'asc' },
      include: {
        relatives: true
      }
    }),
    prisma.obituary.count({ where })
  ]);

  return {
    obituaries,
    totalObituaries
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
