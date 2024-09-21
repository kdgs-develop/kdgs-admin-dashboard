'use server';

import { deleteObituaryById } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function deleteObituary(formData: FormData) {
  const id = Number(formData.get('id'));
  await deleteObituaryById(id);
  revalidatePath('/');
}