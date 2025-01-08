'use server';

import { prisma } from '@/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';
import { Prisma, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

interface CreateGenealogistParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  password: string;
}

interface UpdateGenealogistParams {
  id: number;
  phone?: string;
  role?: string;
}

export async function createGenealogist({
  firstName,
  lastName,
  email,
  phone,
  role,
  password
}: CreateGenealogistParams) {
  try {
    // Create user in Clerk (without phone number)
    const clerkUser = await clerkClient().users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password
    });

    // Create user in our database (including phone number)
    const genealogist = await prisma.genealogist.create({
      data: {
        fullName: `${firstName} ${lastName}`,
        phone,
        clerkId: clerkUser.id,
        role: role as Role
      }
    });

    return { ...genealogist, email };
  } catch (error) {
    console.error('Error creating genealogist:', error);
    throw error;
  }
}

export async function deleteGenealogist(id: number) {
  try {
    const genealogist = await prisma.genealogist.findUnique({ where: { id } });
    if (!genealogist) throw new Error('Genealogist not found');

    // Delete user from Clerk
    await clerkClient().users.deleteUser(genealogist.clerkId);

    // Delete user from our database
    await prisma.genealogist.delete({ where: { id } });
  } catch (error) {
    console.error('Error deleting genealogist:', error);
    throw error;
  }
}

export async function getGenealogists() {
  try {
    const genealogists = await prisma.genealogist.findMany({
      select: {
        id: true,
        clerkId: true,
        fullName: true,
        phone: true,
        role: true
      }
    });

    const genealogistsWithEmail = await Promise.all(
      genealogists.map(async (genealogist) => {
        const clerkUser = await clerkClient().users.getUser(
          genealogist.clerkId
        );
        return {
          ...genealogist,
          email: clerkUser.emailAddresses[0]?.emailAddress || ''
        };
      })
    );

    return genealogistsWithEmail;
  } catch (error) {
    console.error('Error fetching genealogists:', error);
    throw error;
  }
}

export async function updateGenealogist({
  id,
  phone,
  role
}: UpdateGenealogistParams) {
  try {
    const genealogist = await prisma.genealogist.findUnique({ where: { id } });
    if (!genealogist) throw new Error('Genealogist not found');

    // Update user in our database
    const updatedGenealogist = await prisma.genealogist.update({
      where: { id },
      data: {
        phone,
        role: role as Role
      }
    });

    // Update user role in Clerk if it has changed
    if (role) {
      await clerkClient().users.updateUser(genealogist.clerkId, {
        publicMetadata: { role }
      });
    }

    return updatedGenealogist;
  } catch (error) {
    console.error('Error updating genealogist:', error);
    throw error;
  }
}

export async function updateGenealogistPassword(
  id: number,
  newPassword: string
) {
  try {
    const genealogist = await prisma.genealogist.findUnique({ where: { id } });
    if (!genealogist) throw new Error('Genealogist not found');

    await clerkClient().users.updateUser(genealogist.clerkId, {
      password: newPassword
    });

    return true;
  } catch (error) {
    console.error('Error updating genealogist password:', error);
    throw error;
  }
}

export async function getCities(): Promise<
  Prisma.CityGetPayload<{ include: { country: true } }>[]
> {
  try {
    const cities = await prisma.city.findMany({
      include: {
        country: true
      },
      orderBy: {
        country: {
          name: 'asc'
        }
      }
    });

    return cities as Prisma.CityGetPayload<{ include: { country: true } }>[];
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw new Error('Failed to fetch cities');
  }
}

export async function addCity(
  name: string | null,
  province: string | null,
  countryId: number
) {
  try {
    // Check for existing city with exact match including null values
    const existingCity = await prisma.city.findFirst({
      where: {
        AND: [
          { name: name }, // This will match null with null
          { province: province }, // This will match null with null
          { countryId: countryId }
        ]
      }
    });

    if (existingCity) {
      throw new Error(
        'A location with these exact details already exists in the database'
      );
    }

    // Create the new city
    const newCity = await prisma.city.create({
      data: {
        name,
        province,
        countryId
      },
      include: {
        country: true
      }
    });

    revalidatePath('/');

    return {
      id: newCity.id,
      name: newCity.name,
      province: newCity.province,
      country: { name: newCity.country?.name ?? '' }
    };
  } catch (error) {
    console.error('Error adding new city:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A location with these details already exists');
      }
    }
    throw error;
  }
}

export async function getCountries(page: number = 1, pageSize: number = 5) {
  try {
    const totalCount = await prisma.country.count();
    const countries = await prisma.country.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });

    return {
      countries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw new Error('Failed to fetch countries');
  }
}

export async function searchCountries(
  searchTerm: string,
  page: number = 1,
  pageSize: number = 5
) {
  try {
    const where: Prisma.CountryWhereInput = {
      name: {
        contains: searchTerm,
        mode: Prisma.QueryMode.insensitive
      }
    };

    const totalCount = await prisma.country.count({ where });

    const countries = await prisma.country.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });

    return {
      countries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error searching countries:', error);
    throw new Error('Failed to search countries');
  }
}

export async function addCountry(name: string) {
  try {
    const existing = await prisma.country.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (existing) {
      throw new Error('A country with this name already exists');
    }

    const newCountry = await prisma.country.create({
      data: { name }
    });
    revalidatePath('/');
    return newCountry;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add country');
  }
}

export async function getFileBoxes() {
  try {
    const fileBoxes = await prisma.fileBox.findMany({
      orderBy: {
        year: 'desc'
      }
    });
    return fileBoxes;
  } catch (error) {
    throw new Error('Failed to fetch file boxes');
  }
}

export async function searchFileBoxes(year?: number, number?: number) {
  try {
    const whereClause: any = {};
    if (year) whereClause.year = year;
    if (number) whereClause.number = number;

    const fileBoxes = await prisma.fileBox.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { number: 'asc' }]
    });
    return fileBoxes;
  } catch (error) {
    console.error('Error searching file boxes:', error);
    throw new Error('Failed to search file boxes');
  }
}

export async function addFileBox(year: number, number: number) {
  try {
    // First check if the file box already exists
    const existing = await prisma.fileBox.findFirst({
      where: {
        AND: [{ year }, { number }]
      }
    });

    if (existing) {
      throw new Error(
        'A file box with this year and number combination already exists'
      );
    }

    const fileBox = await prisma.fileBox.create({
      data: {
        year,
        number
      }
    });
    return fileBox;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A file box with this combination already exists');
      }
    }
    throw error;
  }
}

export async function updateFileBox(id: number, year: number, number: number) {
  try {
    // First check if another file box exists with the same year and number
    const existing = await prisma.fileBox.findFirst({
      where: {
        AND: [
          { year },
          { number },
          { NOT: { id } } // Exclude the current file box
        ]
      }
    });

    if (existing) {
      throw new Error(
        'A file box with this year and number combination already exists'
      );
    }

    const fileBox = await prisma.fileBox.update({
      where: { id },
      data: {
        year,
        number
      }
    });
    return fileBox;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A file box with this combination already exists');
      }
    }
    throw error;
  }
}

export async function deleteFileBox(id: number) {
  try {
    // Check if the file box is being used by any obituaries
    const fileBox = await prisma.fileBox.findUnique({
      where: { id },
      include: { obituaries: { select: { id: true } } }
    });

    if (fileBox?.obituaries.length) {
      throw new Error(
        'Cannot delete file box that is being used by obituaries'
      );
    }

    await prisma.fileBox.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete file box');
  }
}

export async function getCountriesWithPagination(
  page: number,
  pageSize: number = 5
) {
  try {
    const totalCount = await prisma.country.count();
    const countries = await prisma.country.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: 'asc'
      }
    });

    return {
      countries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw new Error('Failed to fetch countries');
  }
}

export async function deleteCountry(id: number) {
  try {
    // Check if the country is being used by any cities
    const citiesUsingCountry = await prisma.city.count({
      where: { countryId: id }
    });

    if (citiesUsingCountry > 0) {
      throw new Error('Cannot delete country as it is being used by cities');
    }

    await prisma.country.delete({
      where: { id }
    });
    revalidatePath('/');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete country');
  }
}

export async function updateCountry(id: number, name: string) {
  try {
    const existing = await prisma.country.findFirst({
      where: {
        AND: [{ name: { equals: name, mode: 'insensitive' } }, { NOT: { id } }]
      }
    });

    if (existing) {
      throw new Error('A country with this name already exists');
    }

    const country = await prisma.country.update({
      where: { id },
      data: { name }
    });
    revalidatePath('/');
    return country;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update country');
  }
}

export async function getCitiesWithPagination(
  page: number,
  pageSize: number = 5
) {
  try {
    const totalCount = await prisma.city.count();
    const cities = await prisma.city.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: 'asc'
      },
      include: {
        country: true
      }
    });

    return {
      cities,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw new Error('Failed to fetch cities');
  }
}

export async function updateCity(
  id: number,
  name: string | null,
  province: string | null,
  countryId: number
) {
  try {
    const city = await prisma.city.update({
      where: { id },
      data: {
        name,
        province,
        countryId
      },
      include: {
        country: true
      }
    });
    return city;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update city');
  }
}

export async function deleteCity(id: number) {
  try {
    // Check if the city is being used by any obituaries or cemeteries
    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        obituaries_birthCityId: { select: { id: true } },
        obituaries_deathCityId: { select: { id: true } },
        cemeteries: { select: { id: true } }
      }
    });

    if (
      city?.obituaries_birthCityId.length ||
      city?.obituaries_deathCityId.length ||
      city?.cemeteries.length
    ) {
      throw new Error(
        'Cannot delete city that is being used by obituaries or cemeteries'
      );
    }

    await prisma.city.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete city');
  }
}

export async function searchCities(
  name?: string,
  province?: string,
  countryId?: number,
  page: number = 1,
  pageSize: number = 5
) {
  try {
    const where: any = {};

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      };
    }

    if (province) {
      where.province = {
        contains: province,
        mode: 'insensitive'
      };
    }

    if (countryId) {
      where.countryId = countryId;
    }

    const totalCount = await prisma.city.count({ where });

    const cities = await prisma.city.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: 'asc'
      },
      include: {
        country: true
      }
    });

    return {
      cities,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error searching cities:', error);
    throw new Error('Failed to search cities');
  }
}

export async function getCemeteriesWithPagination(
  page: number,
  pageSize: number = 5
) {
  try {
    const totalCount = await prisma.cemetery.count();
    const cemeteries = await prisma.cemetery.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: 'asc'
      },
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });

    return {
      cemeteries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error fetching cemeteries:', error);
    throw new Error('Failed to fetch cemeteries');
  }
}

export async function searchCemeteries(
  name?: string,
  cityId?: number,
  page: number = 1,
  pageSize: number = 5
) {
  try {
    const where: any = {};

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      };
    }

    if (cityId) {
      where.cityId = cityId;
    }

    const totalCount = await prisma.cemetery.count({ where });

    const cemeteries = await prisma.cemetery.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: 'asc'
      },
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });

    return {
      cemeteries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error searching cemeteries:', error);
    throw new Error('Failed to search cemeteries');
  }
}

export async function addCemetery(name: string | null, cityId: number | null) {
  try {
    const cemetery = await prisma.cemetery.create({
      data: {
        name,
        cityId
      },
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });
    return cemetery;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add cemetery');
  }
}

export async function updateCemetery(
  id: number,
  name: string | null,
  cityId: number | null
) {
  try {
    const cemetery = await prisma.cemetery.update({
      where: { id },
      data: {
        name,
        cityId
      },
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });
    return cemetery;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update cemetery');
  }
}

export async function deleteCemetery(id: number) {
  try {
    // Check if the cemetery is being used by any obituaries
    const cemetery = await prisma.cemetery.findUnique({
      where: { id },
      include: {
        obituaries: { select: { id: true } }
      }
    });

    if (cemetery?.obituaries.length) {
      throw new Error(
        'Cannot delete cemetery that is being used by obituaries'
      );
    }

    await prisma.cemetery.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete cemetery');
  }
}

export async function getPeriodicals(page: number = 1, pageSize: number = 5) {
  try {
    const totalCount = await prisma.periodical.count();
    const periodicals = await prisma.periodical.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });

    return {
      periodicals,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error fetching periodicals:', error);
    throw new Error('Failed to fetch periodicals');
  }
}

export async function searchPeriodicals(
  searchTerm: string,
  page: number = 1,
  pageSize: number = 5
) {
  try {
    const where: Prisma.PeriodicalWhereInput = {
      name: {
        contains: searchTerm,
        mode: Prisma.QueryMode.insensitive
      }
    };

    const totalCount = await prisma.periodical.count({ where });

    const periodicals = await prisma.periodical.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });

    return {
      periodicals,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error searching periodicals:', error);
    throw new Error('Failed to search periodicals');
  }
}

export async function addPeriodical(name: string) {
  return prisma.$transaction(async (prisma) => {
    // Check if periodical already exists
    const existing = await prisma.periodical.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (existing) {
      throw new Error('A periodical with this name already exists');
    }

    await prisma.$executeRaw`SELECT setval('periodical_id_seq', COALESCE((SELECT MAX(id) FROM "Periodical"), 1));`;
    const newPeriodical = await prisma.periodical.create({
      data: { name }
    });
    revalidatePath('/');
    return newPeriodical;
  });
}

export async function updatePeriodical(id: number, name: string) {
  try {
    // Check if another periodical exists with the same name
    const existing = await prisma.periodical.findFirst({
      where: {
        AND: [{ name: { equals: name, mode: 'insensitive' } }, { NOT: { id } }]
      }
    });

    if (existing) {
      throw new Error('A periodical with this name already exists');
    }

    const periodical = await prisma.periodical.update({
      where: { id },
      data: { name }
    });
    revalidatePath('/');
    return periodical;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new Error('A periodical with this name already exists');
      }
    }
    throw error;
  }
}

export async function deletePeriodical(id: number) {
  try {
    // Check if the periodical is being used by any obituaries
    const obituariesUsingPeriodical = await prisma.obituary.count({
      where: { periodicalId: id }
    });

    if (obituariesUsingPeriodical > 0) {
      throw new Error(
        'Cannot delete periodical as it is being used by obituaries'
      );
    }

    await prisma.periodical.delete({
      where: { id }
    });
    revalidatePath('/');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete periodical');
  }
}

export async function getTitles(page: number = 1, pageSize: number = 5) {
  try {
    const totalCount = await prisma.title.count();
    const titles = await prisma.title.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });

    return {
      titles,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error fetching titles:', error);
    throw new Error('Failed to fetch titles');
  }
}

export async function searchTitles(
  searchTerm: string,
  page: number = 1,
  pageSize: number = 5
) {
  try {
    const where: Prisma.TitleWhereInput = {
      name: {
        contains: searchTerm,
        mode: Prisma.QueryMode.insensitive
      }
    };

    const totalCount = await prisma.title.count({ where });

    const titles = await prisma.title.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });

    return {
      titles,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error('Error searching titles:', error);
    throw new Error('Failed to search titles');
  }
}

export async function addTitle(name: string) {
  try {
    const existing = await prisma.title.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });

    if (existing) {
      throw new Error('A title with this name already exists');
    }

    const newTitle = await prisma.title.create({
      data: { name }
    });
    revalidatePath('/');
    return newTitle;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add title');
  }
}

export async function updateTitle(id: number, name: string) {
  try {
    const existing = await prisma.title.findFirst({
      where: {
        AND: [{ name: { equals: name, mode: 'insensitive' } }, { NOT: { id } }]
      }
    });

    if (existing) {
      throw new Error('A title with this name already exists');
    }

    const title = await prisma.title.update({
      where: { id },
      data: { name }
    });
    revalidatePath('/');
    return title;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update title');
  }
}

export async function deleteTitle(id: number) {
  try {
    const obituariesUsingTitle = await prisma.obituary.count({
      where: { titleId: id }
    });

    if (obituariesUsingTitle > 0) {
      throw new Error('Cannot delete title as it is being used by obituaries');
    }

    await prisma.title.delete({
      where: { id }
    });
    revalidatePath('/');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete title');
  }
}

export async function getObituaryCountForFileBox(
  fileBoxId: number
): Promise<number> {
  try {
    const count = await prisma.obituary.count({
      where: {
        fileBoxId: fileBoxId
      }
    });
    return count;
  } catch (error) {
    console.error('Error fetching obituary count for file box:', error);
    throw new Error('Failed to fetch obituary count');
  }
}

export async function getOpenFileBoxId(): Promise<number> {
  const setting = await prisma.settings.findUnique({
    where: {
      id: 'open_filebox_id'
    }
  });

  return setting ? parseInt(setting.value) : 0; // Return 0 if no setting found
}

export async function setOpenFileBoxId(id: number) {
  try {
    await prisma.settings.upsert({
      where: {
        id: 'open_filebox_id'
      },
      update: {
        value: id.toString()
      },
      create: {
        id: 'open_filebox_id',
        value: id.toString()
      }
    });
    return true;
  } catch (error) {
    console.error('Error setting open file box:', error);
    throw new Error('Failed to set open file box');
  }
}

export async function getRelationships(page: number, perPage: number) {
  const skip = (page - 1) * perPage;
  const [relationships, totalCount] = await prisma.$transaction([
    prisma.familyRelationship.findMany({
      skip,
      take: perPage,
      orderBy: { name: 'asc' }
    }),
    prisma.familyRelationship.count()
  ]);

  return {
    relationships,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage)
  };
}

export async function searchRelationships(
  searchTerm: string,
  page: number,
  perPage: number
) {
  const skip = (page - 1) * perPage;
  const [relationships, totalCount] = await prisma.$transaction([
    prisma.familyRelationship.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      skip,
      take: perPage,
      orderBy: { name: 'asc' }
    }),
    prisma.familyRelationship.count({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      }
    })
  ]);

  return {
    relationships,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage)
  };
}

export async function addRelationship(name: string, category: string) {
  const existing = await prisma.familyRelationship.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } }
  });

  if (existing) {
    throw new Error('A relationship with this name already exists');
  }

  const relationship = await prisma.familyRelationship.create({
    data: { name, category }
  });
  revalidatePath('/');
  return relationship;
}

export async function updateRelationship(
  id: string,
  name: string,
  category: string
) {
  const existing = await prisma.familyRelationship.findFirst({
    where: {
      AND: [{ name: { equals: name, mode: 'insensitive' } }, { NOT: { id } }]
    }
  });

  if (existing) {
    throw new Error('A relationship with this name already exists');
  }

  const relationship = await prisma.familyRelationship.update({
    where: { id },
    data: { name, category }
  });
  revalidatePath('/');
  return relationship;
}

export async function deleteRelationship(id: string) {
  await prisma.familyRelationship.delete({
    where: { id }
  });
  revalidatePath('/');
}
