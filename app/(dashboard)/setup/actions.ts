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

    return genealogist;
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
        name: 'asc'
      }
    });

    return cities as Prisma.CityGetPayload<{ include: { country: true } }>[];
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw new Error('Failed to fetch cities');
  }
}

export async function addCity(name: string, province: string, countryId: number ) {
  console.log("addCity function called with data:", { name, province, countryId });
  try {
    // Check for existing city
    const existingCity = await prisma.city.findFirst({
      where: {
        name: name,
        province: province,
        countryId: countryId,
      },
    });

    if (existingCity) {
      throw new Error('A city with this name, province, and country already exists');
    }

    // Create the new city
    const newCity = await prisma.city.create({
      data: {
        name: name,
        province: province,
        countryId: countryId,
      },
      include: {
        country: true
      }
    });

    // Revalidate the path to update the UI
    revalidatePath('/');

    console.log("New city created:", newCity);
    return {
      id: newCity.id,
      name: newCity.name,
      province: newCity.province,
      country: { name: newCity.country?.name ?? '' }
    };
  } catch (error) {
    console.error('Error adding new city:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // The .code property can be accessed in a type-safe manner
      if (error.code === 'P2002') {
        throw new Error('A city with this name already exists in this country and province');
      }
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to add new city');
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
