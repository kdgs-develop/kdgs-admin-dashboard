'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ClerkProvider } from '@clerk/nextjs';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl={"/login"}>
      <TooltipProvider>{children}</TooltipProvider>
    </ClerkProvider>
  );
}
