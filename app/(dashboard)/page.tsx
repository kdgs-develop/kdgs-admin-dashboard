'use client';

import { useSearchParams } from 'next/navigation';
import { ObituariesTable } from './obituaries-table';

export default function ObituaryIndexPage() {
  const searchParams = useSearchParams();
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);
  const limit = 5; // Set to 5 obituaries per page
  const search = searchParams.get('q') ?? '';

  return (
    <div className="container mx-auto p-4 max-w-[calc(4xl)]">
      <ObituariesTable
        offset={offset}
        limit={limit}
        search={search}
        refreshTrigger={0}
      />
    </div>
  );
}
