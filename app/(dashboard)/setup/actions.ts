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

export async function createGenealogist({ firstName, lastName, email, phone, role, password }: CreateGenealogistParams) {
  try {
    // Create user in Clerk (without phone number)
    const clerkUser = await clerkClient().users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password,
    });

    // Create user in our database (including phone number)
    const genealogist = await prisma.genealogist.create({
      data: {
        fullName: `${firstName} ${lastName}`,
        phone,
        clerkId: clerkUser.id,
        role: role as Role,
      },
    });

    return {...genealogist, email};
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
        role: true,
      },
    });

    const genealogistsWithEmail = await Promise.all(
      genealogists.map(async (genealogist) => {
        const clerkUser = await clerkClient().users.getUser(genealogist.clerkId);
        return {
          ...genealogist,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
        };
      })
    );

    return genealogistsWithEmail;
  } catch (error) {
    console.error('Error fetching genealogists:', error);
    throw error;
  }
}

export async function updateGenealogist({ id, phone, role }: UpdateGenealogistParams) {
  try {
    const genealogist = await prisma.genealogist.findUnique({ where: { id } });
    if (!genealogist) throw new Error('Genealogist not found');

    // Update user in our database
    const updatedGenealogist = await prisma.genealogist.update({
      where: { id },
      data: {
        phone,
        role: role as Role,
      },
    });

    // Update user role in Clerk if it has changed
    if (role) {
      await clerkClient().users.updateUser(genealogist.clerkId, {
        publicMetadata: { role },
      });
    }

    return updatedGenealogist;
  } catch (error) {
    console.error('Error updating genealogist:', error);
    throw error;
  }
}

export async function updateGenealogistPassword(id: number, newPassword: string) {
  try {
    const genealogist = await prisma.genealogist.findUnique({ where: { id } });
    if (!genealogist) throw new Error('Genealogist not found');

    await clerkClient().users.updateUser(genealogist.clerkId, {
      password: newPassword,
    });

    return true;
  } catch (error) {
    console.error('Error updating genealogist password:', error);
    throw error;
  }
}

export async function getCities(): Promise<Prisma.CityGetPayload<{ include: { country: true } }>[]> {
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

export async function addCity(name: string | null, province: string | null, countryId: number) {
  try {
    // Check for existing city with exact match including null values
    const existingCity = await prisma.city.findFirst({
      where: {
        AND: [
          { name: name },  // This will match null with null
          { province: province }, // This will match null with null
          { countryId: countryId }
        ]
      },
    });

    if (existingCity) {
      throw new Error('A location with these exact details already exists in the database');
    }

    // Create the new city
    const newCity = await prisma.city.create({
      data: {
        name,
        province,
        countryId,
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

export async function getCountries(): Promise<{ id: number; name: string }[]> {
  try {
    const countries = await prisma.country.findMany();
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw new Error('Failed to fetch countries');
  }
}

export async function addCountry(name: string) {
  try {
    // First check if country exists (case-insensitive)
    const existingCountry = await prisma.country.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });

    if (existingCountry) {
      throw new Error('A country with this name already exists');
    }

    const country = await prisma.country.create({
      data: {
        name,
      },
    });
    return country;
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
        year: 'desc',
      },
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
      orderBy: [
        { year: 'desc' },
        { number: 'asc' }
      ]
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
        AND: [
          { year },
          { number }
        ]
      }
    });

    if (existing) {
      throw new Error('A file box with this year and number combination already exists');
    }

    const fileBox = await prisma.fileBox.create({
      data: {
        year,
        number,
      },
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
      throw new Error('A file box with this year and number combination already exists');
    }

    const fileBox = await prisma.fileBox.update({
      where: { id },
      data: {
        year,
        number,
      },
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
      throw new Error('Cannot delete file box that is being used by obituaries');
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

export async function getCountriesWithPagination(page: number, pageSize: number = 5) {
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
    const country = await prisma.country.findUnique({
      where: { id },
      include: { cities: { select: { id: true } } }
    });

    if (country?.cities.length) {
      throw new Error('Cannot delete country that is being used by locations');
    }

    await prisma.country.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete country');
  }
}