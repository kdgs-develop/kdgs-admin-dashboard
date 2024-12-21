'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  Image as LucideImage,
  Settings
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { NavItem } from './nav-item';

function ToggleButton({
  isOpen,
  onClick
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="absolute -right-3 top-4 h-6 w-6 rounded-full border bg-background shadow-sm"
    >
      {isOpen ? (
        <ChevronLeft className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
    </Button>
  );
}

interface DesktopNavProps {
  role?: string | null;
}

export function DesktopNav({ role }: DesktopNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-10 hidden flex-col border-r sm:flex',
        'transition-[width] duration-300 ease-in-out',
        isOpen ? 'w-64 bg-background' : 'w-14 bg-background'
      )}
    >
      <ToggleButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />

      <nav
        className={cn(
          'flex flex-col items-center gap-4 px-0 sm:py-5',
          isOpen ? 'items-start' : 'group-hover:items-start'
        )}
      >
        <Link
          href="/"
          className="group flex h-9 w-full items-center gap-3 rounded-lg px-2 text-lg font-semibold"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Image
              className="h-4 w-4 transition-all"
              src={'/icon.png'}
              alt="Logo"
              width={64}
              height={64}
            />
          </div>
          {isOpen && <span className="text-sm">KDGS Dashboard</span>}
        </Link>

        <NavItem href="/" label="Obituary Index">
          <Home className="h-5 w-5" />
        </NavItem>

        <NavItem href="/images" label="Obituary Images">
          <LucideImage className="h-5 w-5" />
        </NavItem>

        <NavItem href="/reports" label="Reports">
          <FileText className="h-5 w-5" />
        </NavItem>

        {role === 'ADMIN' && (
          <NavItem href="/setup" label="Admin Setup">
            <Settings className="h-5 w-5" />
          </NavItem>
        )}
      </nav>
    </aside>
  );
}
