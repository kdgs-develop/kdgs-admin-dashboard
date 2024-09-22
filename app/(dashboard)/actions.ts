'use server';

import { deleteObituaryById, getObituaries, updateObituary } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCities, getFileBoxes, getPeriodicals, getTitles, Obituary } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function deleteObituary(formData: FormData) {
  const id = Number(formData.get('id'));
  await deleteObituaryById(id);
  revalidatePath('/');
}

interface EditObituaryDialogData {
  titles: { id: number; name: string }[];
  cities: { id: number; name: string; province: string | null; country: { name: string } | null }[];
  periodicals: { id: number; name: string }[];
  fileBoxes: { id: number; year: number; number: number }[];
}

export async function getEditObituaryDialogData(): Promise<EditObituaryDialogData> {
  const [rawTitles, rawCities, rawPeriodicals, fileBoxes] = await Promise.all([
    getTitles(),
    getCities(),
    getPeriodicals(),
    getFileBoxes(),
  ]);

  const titles = rawTitles.filter((title): title is { id: number; name: string } => 
    title.name !== null
  );

  const cities = rawCities.filter((city): city is { id: number; name: string; province: string | null; country: { name: string } | null } => 
    city.name !== null
  );

  const periodicals = rawPeriodicals.filter((periodical): periodical is { id: number; name: string } => 
    periodical.name !== null
  );

  return {
    titles,
    cities,
    periodicals,
    fileBoxes,
  };
}

export async function updateObituaryAction(obituaryData: Partial<Obituary> & { id: number }): Promise<Obituary> {
  'use server';
  const updatedObituaryData = {
    ...obituaryData,
    reference: 'reference' in obituaryData ? obituaryData.reference : await generateReference(obituaryData.surname || ''),
  };
  const updatedObituary = await updateObituary(updatedObituaryData);
  revalidatePath('/');
  return updatedObituary;
}

export async function generateReference(surname: string): Promise<string> {
  const prefix = surname.slice(0, 4).toUpperCase();
  const latestObituary = await prisma.obituary.findFirst({
    where: {
      reference: {
        startsWith: prefix,
      },
    },
    orderBy: {
      reference: 'desc',
    },
  });

  let suffix = '0001';
  if (latestObituary) {
    const latestNumber = parseInt(latestObituary.reference.slice(-4));
    suffix = (latestNumber + 1).toString().padStart(4, '0');
  }

  return `${prefix}${suffix}`;
}

type CreateObituaryInput = Omit<Prisma.ObituaryCreateInput, 'reference'> & { reference?: string };

export async function createObituary(obituaryData: CreateObituaryInput): Promise<Obituary> {
  const obituaryInput: Prisma.ObituaryCreateInput = {
    ...obituaryData,
    reference: obituaryData.reference || await generateReference(obituaryData.surname || ''),
  };

  return prisma.obituary.create({ data: obituaryInput });
}

export async function fetchObituariesAction(offset: number = 0, limit: number = 5, search: string = '') {
  'use server';
  const { obituaries, totalObituaries } = await getObituaries(search, offset, limit);
  return { obituaries, total: totalObituaries };
}