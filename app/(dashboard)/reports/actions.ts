'use server';

import { prisma } from '@/lib/prisma';

export async function fetchUnproofreadObituariesAction(page: number, itemsPerPage: number) {
  const skip = (page - 1) * itemsPerPage;

  const [obituaries, total] = await Promise.all([
    prisma.obituary.findMany({
      where: {
        proofread: false
      },
      orderBy: {
        reference: 'asc'
      },
      skip,
      take: itemsPerPage,
    }),
    prisma.obituary.count({
      where: {
        proofread: false
      }
    })
  ]);

  return { obituaries, total };
}