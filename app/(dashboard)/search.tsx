'use client';

import { Spinner } from '@/components/icons';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

const SEARCH_OPTIONS = [
  { value: 'regular', label: 'Regular Search' },
  { value: '@reference', label: 'File Number' },
  { value: '@fileBox', label: 'File Box (YYYY N)' },
  { value: '@surname', label: 'Surname' },
  { value: '@givenNames', label: 'Given Names' },
  { value: '@maidenName', label: 'Maiden Name' },
  { value: '@birthDate', label: 'Birth Date (YYYY-MM-DD)' },
  { value: '@birthDateFrom', label: 'Birth Date Range' },
  { value: '@deathDate', label: 'Death Date (YYYY-MM-DD)' },
  { value: '@deathDateFrom', label: 'Death Date Range' },
  { value: '@proofread', label: 'Proofread Status (true/false)' },
  { value: '@images', label: 'Images Status (true/false)' },
  { value: '@imagesProofread', label: 'Images (true/false) Proofread (true/false)' },
  { value: '@proofreadDate', label: 'Proofread Date (YYYY-MM-DD)' },
  { value: '@proofreadDateFrom', label: 'Proofread Date Range' },
  { value: '@enteredBy', label: 'Entered By' },
  { value: '@enteredOn', label: 'Entered On (YYYY-MM-DD)' },
  { value: '@enteredOnFrom', label: 'Entered On Range' },
  { value: '@aka.surname', label: 'Also Known As - Surname' },
  { value: '@aka.otherNames', label: 'Also Known As - Other Names' }
];

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [context, setContext] = useState('obituaries');
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContext(pathname.startsWith('/images') ? 'images' : 'obituaries');
  }, [pathname]);

  function searchAction(formData: FormData) {
    let value = formData.get('q') as string;
    let params = new URLSearchParams(window.location.search);
    params.set('q', value);
    params.set('offset', '0');
    startTransition(() => {
      const baseUrl = context === 'images' ? '/images' : '/';
      router.push(`${baseUrl}?${params.toString()}`);
    });
  }

  function handleSearchOptionChange(value: string) {
    if (value === 'regular') {
      setSearchValue('');
    } else {
      const dateRangeOptions = [
        '@birthDateFrom',
        '@deathDateFrom',
        '@proofreadDateFrom',
        '@enteredOnFrom'
      ];
      const dateOptions = [
        '@birthDate',
        '@deathDate',
        '@proofreadDate',
        '@enteredOn'
      ];

      let newSearchValue = '';
      if (dateRangeOptions.includes(value)) {
        newSearchValue = `${value} YYYY-MM-DD @${value.slice(1, -4)}To YYYY-MM-DD`;
        } else if (value === '@proofread') {
          newSearchValue = `${value} true`;
      } else if (value === '@images') {
        newSearchValue = `${value} true`;
      } else if (value === '@imagesProofread') {
        newSearchValue = `${value} true false`;
      } else if (value.includes('Date')) {
        newSearchValue = `${value} YYYY-MM-DD`;
      } else if (value === '@reference') {
        newSearchValue = `@fileNumber `;
      } else if (value === '@fileBox') {
        newSearchValue = `@fileBox YYYY N`;
      } else {
        newSearchValue = `${value} `;
      }

      setSearchValue(newSearchValue);

      // Focus the input and move cursor to the end using the new value's length
      if (value !== 'regular') {
        setTimeout(() => {
          if (dateOptions.includes(value)) {
            if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.setSelectionRange(
                newSearchValue.length - 10,
                newSearchValue.length
              );
            }
          } else {
            if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.setSelectionRange(
                newSearchValue.length,
                newSearchValue.length
              );
            }
          }
        }, 0);
      }
    }
  }

  return (
    <div className="relative ml-auto flex gap-2 flex-1 md:grow-0">
      {context === 'obituaries' && (
        <Select onValueChange={handleSearchOptionChange}>
          <SelectTrigger className="w-[150px] lg:w-[180px]">
            <SelectValue placeholder="Search type..." />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <form action={searchAction} className="relative flex-1">
        <Search className="absolute left-2.5 top-[.75rem] h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          name="q"
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={`Search ${context}...`}
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[485px]"
        />
        {isPending && <Spinner />}
      </form>
    </div>
  );
}
