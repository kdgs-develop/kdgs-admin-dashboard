"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SearchLoadingContextType {
  isSearchLoading: boolean;
  setIsSearchLoading: (loading: boolean) => void;
}

const SearchLoadingContext = createContext<
  SearchLoadingContextType | undefined
>(undefined);

export function SearchLoadingProvider({ children }: { children: ReactNode }) {
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  return (
    <SearchLoadingContext.Provider
      value={{ isSearchLoading, setIsSearchLoading }}
    >
      {children}
    </SearchLoadingContext.Provider>
  );
}

export function useSearchLoading() {
  const context = useContext(SearchLoadingContext);
  if (context === undefined) {
    throw new Error(
      "useSearchLoading must be used within a SearchLoadingProvider"
    );
  }
  return context;
}
