"use client";

import { ReactNode } from "react";
import { SearchLoadingProvider } from "./search-loading-context";

interface DashboardClientWrapperProps {
  children: ReactNode;
}

export function DashboardClientWrapper({
  children
}: DashboardClientWrapperProps) {
  return <SearchLoadingProvider>{children}</SearchLoadingProvider>;
}
