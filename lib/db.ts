import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function getObituaries(
  search: string,
  offset: number
): Promise<{
  obituaries: Obituary[];
  newOffset: number | null;
  totalObituaries: number;
}> {
  const where: Prisma.ObituaryWhereInput = search
    ? {
        surname: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }
    : {};

  const [obituaries, totalObituaries] = await Promise.all([
    prisma.obituary.findMany({
      where,
      take: 5,
      skip: offset,
      orderBy: { reference: 'asc' },
    }),
    prisma.obituary.count({ where }),
  ]);

  const newOffset = obituaries.length === 5 ? offset + 5 : null;

  return {
    obituaries,
    newOffset,
    totalObituaries,
  };
}

export async function deleteObituaryById(id: number) {
  await prisma.obituary.delete({ where: { id } });
}

export type Obituary = Awaited<ReturnType<typeof prisma.obituary.findUnique>>;