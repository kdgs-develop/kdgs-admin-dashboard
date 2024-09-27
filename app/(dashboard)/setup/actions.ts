'use server';

import { prisma } from '@/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';
import { Role } from '@prisma/client';

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