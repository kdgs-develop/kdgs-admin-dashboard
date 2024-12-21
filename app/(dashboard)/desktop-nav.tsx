'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Role } from '@prisma/client';
import {
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

interface DesktopNavProps {
  role: Role;
}

export function DesktopNav({ role }: DesktopNavProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <aside
      className={cn(
        'hidden sm:flex flex-col border-r min-h-screen',
        'transition-all duration-900 ease-in-out',
        isOpen ? 'max-w-fit pr-4' : 'w-14',
        'bg-background'
      )}
    >
      <nav className="flex flex-col px-1 py-2.5 pl-2.5 sticky top-0">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="flex h-9 w-full items-center gap-3 rounded-lg text-lg font-semibold"
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
            {isOpen && <span className="text-sm">K&DGS</span>}
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-1">
          <NavItem href="/" label="Index" isOpen={isOpen}>
            <Home className="h-5 w-5" />
          </NavItem>

          <NavItem href="/images" label="Images" isOpen={isOpen}>
            <LucideImage className="h-5 w-5" />
          </NavItem>

          {role !== 'VIEWER' && (
            <NavItem href="/reports" label="Reports" isOpen={isOpen}>
              <FileText className="h-5 w-5" />
            </NavItem>
          )}

          {role === 'ADMIN' && (
            <NavItem href="/setup" label="Admin" isOpen={isOpen}>
              <Settings className="h-5 w-5" />
            </NavItem>
          )}

          <div className="flex items-center justify-end mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="hover:bg-accent"
            >
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
