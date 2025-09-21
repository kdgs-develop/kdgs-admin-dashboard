'use client';

import { useSearchParams } from 'next/navigation';
import { ImageTable } from './image-table';

export function ImageTableWrapper() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('q') || '';

  return <ImageTable initialSearchQuery={searchQuery} />;
} 