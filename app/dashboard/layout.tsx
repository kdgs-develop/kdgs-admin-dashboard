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
import { DashboardClientWrapper } from "./dashboard-client-wrapper";
import { DesktopNav } from "./desktop-nav";
import { SearchInput } from "./search";
import { UserClerkButton } from "./user-clerk-button";
import { Footer } from "@/components/footer";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const authUser: User | null = await currentUser();
  if (!authUser) redirect("/login");
  const userRole = await getUserRole();

  return (
    <div className="h-screen flex flex-col" style={{ height: "100dvh" }}>
      <div className="flex flex-1 w-full bg-background overflow-hidden">
        <DesktopNav role={userRole} />
        <DashboardClientWrapper>
          <div className="flex flex-1 flex-col transition-all duration-300 ease-in-out pt-2">
            <header className="sticky top-0 border-b bg-background z-20">
              {/* Top Row - Always visible with different content based on screen size */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                {/* Left side - Mobile nav button (only < 1080px) */}
                <div className="flex items-center">
                  <MobileNav />
                </div>

                {/* Center - App title (always visible) */}
                <div className="flex-1 flex items-center justify-center">
                  <h1 className="text-sm font-medium text-muted-foreground">
                    KDGS Admin Dashboard
                  </h1>
                </div>

                {/* Right side - User auth button (always visible) */}
                <div className="flex items-center">
                  <UserClerkButton />
                </div>
              </div>

              {/* Search Components Row */}
              <div className="px-4 py-3">
                <SearchInput />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <div className="p-3">
                <TransitionWrapper>{children}</TransitionWrapper>
              </div>
            </main>
          </div>
        </DashboardClientWrapper>
      </div>
      <Footer />
      <Analytics />
    </div>
  );
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="nav:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="/dashboard"
            className="group flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg text-lg font-semibold md:text-base"
          >
            <Image
              className="h-8 w-auto transition-all group-hover:scale-105"
              src="/kdgs.png"
              alt="KDGS Logo"
              width={120}
              height={40}
              priority
              unoptimized
            />
            <span className="sr-only">KDGS Dashboard</span>
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
