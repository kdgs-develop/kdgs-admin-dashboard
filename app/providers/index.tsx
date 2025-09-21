"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import React, {
  useEffect,
  useState,
  ReactNode,
  createContext,
  useContext
} from "react";

// Create a context for pathname
export const PathnameContext = createContext<string>("");

// Create a hook to use the pathname context
export function usePathnameContext() {
  const context = useContext(PathnameContext);
  if (context === undefined) {
    throw new Error(
      "usePathnameContext must be used within a PathnameProvider"
    );
  }
  return context;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl={"/login"} signInFallbackRedirectUrl={"/dashboard"}>
      <TooltipProvider>
        <PathnameProvider>{children}</PathnameProvider>
      </TooltipProvider>
    </ClerkProvider>
  );
}

export function PathnameProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [currentPathname, setCurrentPathname] = useState("");

  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  return (
    <PathnameContext.Provider value={currentPathname}>
      {children}
    </PathnameContext.Provider>
  );
}

import { motion, AnimatePresence } from "framer-motion";

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
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
