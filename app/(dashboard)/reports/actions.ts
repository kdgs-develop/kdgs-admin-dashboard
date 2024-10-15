'use server';

import { prisma } from '@/lib/prisma';

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
