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

import { motion, AnimatePresence } from 'framer-motion';

export function TransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentPathname, setCurrentPathname] = useState(pathname);

  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPathname}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}