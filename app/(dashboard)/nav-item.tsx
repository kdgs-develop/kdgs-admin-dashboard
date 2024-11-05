'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavItem({
  href,
  label,
  children
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={clsx(
            'flex h-9 items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8',
            'group-hover:w-full group-hover:justify-start group-hover:px-3 group-hover:gap-3',
            'w-9 justify-center md:w-8',
            {
              'font-semibold': pathname === href
            }
          )}
        >
          <span className="shrink-0">{children}</span>
          <span className="hidden group-hover:inline whitespace-nowrap">{label}</span>
          <span className="sr-only">{label}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="group-hover:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
