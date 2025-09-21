import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getUserRole } from "@/lib/db";
import { currentUser, User } from "@clerk/nextjs/server";
import { Analytics } from "@vercel/analytics/react";
import {
  FileText,
  Home,
  Image as LucideImage,
  PanelLeft,
  Settings
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TransitionWrapper } from "../providers";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";
import { DashboardClientWrapper } from "./dashboard-client-wrapper";
import { DesktopNav } from "./desktop-nav";
import { SearchInput } from "./search";
import { UserClerkButton } from "./user-clerk-button";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const authUser: User | null = await currentUser();
  if (!authUser) redirect("/login");
  const userRole = await getUserRole();

  return (
    <div className="flex h-[calc(100vh-100px)] w-full bg-background">
      <DesktopNav role={userRole} />
      <DashboardClientWrapper>
        <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out pt-2">
          <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 z-20">
            <MobileNav />
            <DashboardBreadcrumb />
            <SearchInput />
            <UserClerkButton />
          </header>
          <main className="flex-1">
            <div className="p-3">
              <TransitionWrapper>{children}</TransitionWrapper>
            </div>
          </main>
          <footer>
            <Analytics />
          </footer>
        </div>
      </DashboardClientWrapper>
    </div>
  );
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="/dashboard"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <Image
              className="h-4 w-4 transition-all group-hover:scale-110"
              src={"/icon.png"}
              alt="Logo"
              width={64}
              height={64}
            />

            <span className="sr-only">Obituary Dashboard</span>
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-4 px-2.5 text-foreground"
          >
            <Home className="h-5 w-5" />
            Obituaries
          </Link>
          <Link
            href="/dashboard/images"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <LucideImage className="h-5 w-5" />
            Images
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-5 w-5" />
            Reports
          </Link>
          <Link
            href="/dashboard/setup"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Admin Setup
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
