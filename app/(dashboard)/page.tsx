'use client';

import { ObituariesTable } from './obituaries-table';
import { useSearchParams } from 'next/navigation';

export default function ObituaryIndexPage() {
  const searchParams = useSearchParams();
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const limit = 5; // Set to 5 obituaries per page
  const search = searchParams.get('q') ?? '';

  return (
    <ObituariesTable
      offset={offset}
      limit={limit}
      search={search}
      refreshTrigger={0}
    />
  );
}