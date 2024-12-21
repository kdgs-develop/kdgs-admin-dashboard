'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  label: string;
  children: React.ReactNode;
  isOpen: boolean;
}

export function NavItem({ href, label, children, isOpen }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-2 py-2',
        isActive && 'bg-accent text-accent-foreground',
        isOpen ? 'w-full justify-start' : 'w-10 justify-center'
      )}
    >
      <div className="flex h-5 w-5 items-center justify-center">{children}</div>
      {isOpen && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}
