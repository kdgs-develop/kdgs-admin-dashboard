'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ClerkProvider } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState, ReactNode } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl={"/login"}>
      <TooltipProvider>
        <PathnameProvider>
          {children}
        </PathnameProvider>
      </TooltipProvider>
    </ClerkProvider>
  );
}

export function PathnameProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [currentPathname, setCurrentPathname] = useState('');

  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  return <>{React.cloneElement(children as React.ReactElement, { pathname: currentPathname })}</>;
}