'use server';

import { prisma } from '@/lib/prisma';
import { Genealogist } from '@prisma/client';

export async function fetchObituariesAction(
  reportType: 'proofread' | 'unproofread',
  page: number,
  itemsPerPage: number
) {
  const skip = (page - 1) * itemsPerPage;

  const [obituaries, total] = await Promise.all([
    prisma.obituary.findMany({
      where: {
        proofread: reportType === 'proofread'
      },
      orderBy: {
        reference: 'asc'
      },
      skip,
      take: itemsPerPage,
    }),
    prisma.obituary.count({
      where: {
        proofread: reportType === 'proofread'
      }
    })
  ]);

  return { obituaries, total };
}

export async function fetchCurrentUserAction(userId: string): Promise<Genealogist | null> {
  return prisma.genealogist.findUnique({
    where: { clerkId: userId }
  });
}

export async function fetchObituaryByReferenceAction(reference: string) {
  try {
    return await prisma.obituary.findUnique({
      where: { reference },
      include: {
        title: true,
        alsoKnownAs: true,
        birthCity: true,
        deathCity: true,
        cemetery: true,
        periodical: true,
        fileBox: true,
        relatives: true
      }
    });
  } catch (error) {
    console.error('Error fetching obituary:', error);
    return null;
  }
}