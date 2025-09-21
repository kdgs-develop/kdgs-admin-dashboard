"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const isImagesRoute = pathname?.startsWith("/dashboard/images");
  const isSetupRoute = pathname?.startsWith("/dashboard/setup");
  const isReportsRoute = pathname?.startsWith("/dashboard/reports");
  const currentPage = isImagesRoute
    ? "Obituary Images"
    : isSetupRoute
      ? "Admin Setup"
      : isReportsRoute
        ? "Reports"
        : "Obituary Index";

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
