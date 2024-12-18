'use client';

import { Spinner } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { getObituaries, getTotalResults } from '@/lib/db';
import { cn } from '@/lib/utils';
import { Download, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { forwardRef, useEffect, useRef, useState, useTransition } from 'react';

const SEARCH_OPTIONS = [
  { value: 'regular', label: 'Global Search' },

  { value: 'separator-1', label: '── Files & References ──', disabled: true },
  { value: '@fileNumber', label: 'File Number' },
  { value: '@fileBox', label: 'File Box (YYYY N)' },
  { value: '@batch', label: 'Batch Number' },

  { value: 'separator-2', label: '── Names ──', disabled: true },
  { value: '@surname', label: 'Surname' },
  { value: '@givenNames', label: 'Given Names' },
  { value: '@maidenName', label: 'Maiden Name' },
  { value: '@aka.surname', label: 'Also Known As - Surname' },
  { value: '@aka.otherNames', label: 'Also Known As - Other Names' },

  { value: 'separator-3', label: '── Locations ──', disabled: true },
  { value: '@birthLocation', label: 'Birth Location' },
  { value: '@deathLocation', label: 'Death Location' },
  { value: '@generalLocation', label: 'Other Location' },
  { value: '@cemetery', label: 'Cemetery' },
  { value: '@periodical', label: 'Periodical' },

  { value: 'separator-4', label: '── Dates ──', disabled: true },
  { value: '@birthDate', label: 'Birth Date (YYYY-MM-DD)' },
  { value: '@birthDateFrom', label: 'Birth Date Range' },
  { value: '@deathDate', label: 'Death Date (YYYY-MM-DD)' },
  { value: '@deathDateFrom', label: 'Death Date Range' },
  { value: '@publishDate', label: 'Publish Date (YYYY-MM-DD)' },
  { value: '@publishDateFrom', label: 'Publish Date Range' },

  { value: 'separator-5', label: '── Status ──', disabled: true },
  { value: '@proofreadYes', label: 'Proofread' },
  { value: '@proofreadNo', label: 'Not Proofread' },
  { value: '@hasImages', label: 'Has Images' },
  { value: '@noImages', label: 'No Images' },
  { value: '@imagesProofreadYes', label: 'Has Images & Proofread' },
  { value: '@imagesProofreadNo', label: 'Has Images & Not Proofread' },
  { value: '@noImagesProofreadYes', label: 'No Images & Proofread' },
  { value: '@noImagesProofreadNo', label: 'No Images & Not Proofread' },

  { value: 'separator-6', label: '── Proofread Dates ──', disabled: true },
  { value: '@proofreadDate', label: 'Proofread Date (YYYY-MM-DD)' },
  { value: '@proofreadDateFrom', label: 'Proofread Date Range' },

  { value: 'separator-7', label: '── User Actions ──', disabled: true },
  { value: '@enteredBy', label: 'Entered By' },
  { value: '@enteredOn', label: 'Entered On (YYYY-MM-DD)' },
  { value: '@enteredOnFrom', label: 'Entered On Range' },
  { value: '@editedBy', label: 'Edited By' },
  { value: '@editedOn', label: 'Edited On (YYYY-MM-DD)' },
  { value: '@editedOnFrom', label: 'Edited On Range' }
];

const HighlightedSearchInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ value, ...props }, ref) => {
  const parts = value?.toString().split(' ') || [];
  const command = parts[0].startsWith('@') ? parts[0] : '';

  return (
    <div className="relative w-full">
      <Input
        {...props}
        ref={ref}
        value={value}
        className={cn(
          'w-full rounded-lg bg-background pl-8 md:w-[280px] lg:w-[330px] xl:w-[430px]',
          command && 'text-foreground'
        )}
      />
    </div>
  );
});

HighlightedSearchInput.displayName = 'HighlightedSearchInput';

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [context, setContext] = useState('obituaries');
  const [searchValue, setSearchValue] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
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
        '@enteredOnFrom',
        '@editedOnFrom',
        '@publishDateFrom'
      ];
      const dateOptions = [
        '@birthDate',
        '@deathDate',
        '@proofreadDate',
        '@enteredOn',
        '@editedOn',
        '@publishDate'
      ];
      const booleanOptions = {
        '@proofreadYes': '@proofread true',
        '@proofreadNo': '@proofread false',
        '@hasImages': '@images true',
        '@noImages': '@images false',
        '@imagesProofreadYes': '@imagesProofread true true',
        '@imagesProofreadNo': '@imagesProofread true false',
        '@noImagesProofreadYes': '@imagesProofread false true',
        '@noImagesProofreadNo': '@imagesProofread false false'
      };

      let newSearchValue = '';
      if (dateRangeOptions.includes(value)) {
        newSearchValue = `${value} YYYY-MM-DD @${value.slice(1, -4)}To YYYY-MM-DD`;
      } else if (dateOptions.includes(value)) {
        newSearchValue = `${value} YYYY-MM-DD`;
      } else if (value in booleanOptions) {
        newSearchValue = booleanOptions[value as keyof typeof booleanOptions];
      } else if (value === '@fileBox') {
        newSearchValue = `${value} YYYY N`;
      } else if (
        value === '@cemetery' ||
        value === '@periodical' ||
        value === '@birthLocation' ||
        value === '@deathLocation' ||
        value === '@generalLocation'
      ) {
        newSearchValue = `${value} `; // Leave space for user input
      } else if (value === '@aka.surname' || value === '@aka.otherNames') {
        newSearchValue = `${value} `; // Leave space for user input
      } else if (value === '@enteredBy' || value === '@editedBy') {
        newSearchValue = `${value} `; // Leave space for user input
      } else if (value === '@batch') {
        newSearchValue = `${value} `; // Leave space for user input
      } else {
        newSearchValue = `${value} `; // Default case with space for input
      }

      setSearchValue(newSearchValue);

      // Focus the input and move cursor to the end
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

  const handleDownloadReport = async () => {
    if (!searchValue) return;

    setIsDownloading(true);
    try {
      const response = await fetch('/api/generate-search-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          searchQuery: searchValue,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      const { pdf } = await response.json();
      const pdfBlob = await fetch(pdf).then(res => res.blob());
      const pdfUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      
      const currentDateTime = new Date()
        .toLocaleString('en-CA', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        .replace(/[/,:]/g, '-')
        .replace(' ', '_');
      link.download = `KDGS-Report-${searchValue.replace(/\s+/g, '-')}-${currentDateTime}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(pdfUrl);

      toast({
        title: 'Success',
        description: 'The search results report has been downloaded.'
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download report',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // useEffect(() => {
  //   if (searchValue) {
  //     fetch(`/api/search?q=${encodeURIComponent(searchValue)}`)
  //       .then((res) => res.json())
  //       .then((data) => {
  //         setTotalResults(data.total);
  //       });
  //   }
  // }, [searchValue]);

  return (
    <div className="relative ml-auto flex gap-2 flex-1 md:grow-0">
      {context === 'obituaries' && (
        <Select onValueChange={handleSearchOptionChange}>
          <SelectTrigger className="w-[220px] lg:w-[280px] xl:w-[320px]">
            <SelectValue placeholder="Search type..." />
          </SelectTrigger>
          <SelectContent className="min-w-[220px] lg:min-w-[280px] xl:min-w-[320px]">
            {SEARCH_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={
                  option.disabled ? 'font-semibold text-muted-foreground' : ''
                }
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex gap-2 flex-1">
        <form action={searchAction} className="relative flex-1">
          <Search className="absolute left-2.5 top-[.75rem] h-4 w-4 text-muted-foreground" />
          <HighlightedSearchInput
            ref={inputRef}
            name="q"
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={`Search ${context}...`}
          />
          {isPending && <Spinner />}
        </form>

        <Button
          type="button"
          variant="default"
          onClick={handleDownloadReport}
          disabled={isDownloading || !searchValue}
          className="flex gap-2 items-center whitespace-nowrap bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 w-32 h-10"
        >
          {isDownloading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          PDF Report
        </Button>
      </div>
    </div>
  );
}
