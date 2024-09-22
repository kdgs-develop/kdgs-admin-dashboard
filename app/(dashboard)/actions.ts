'use server';

import { deleteObituaryById, updateObituary } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getCities, getFileBoxes, getPeriodicals, getTitles, Obituary } from '@/lib/db';

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
  const updatedObituary = await updateObituary(obituaryData);
  revalidatePath('/');
  return updatedObituary;
}