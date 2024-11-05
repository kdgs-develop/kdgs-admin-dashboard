import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { prisma } from '@/lib/prisma';
import { auth, currentUser, User } from '@clerk/nextjs/server';
import { Analytics } from '@vercel/analytics/react';
import { Home, Image as LucideImage, FileText, PanelLeft, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TransitionWrapper } from '../providers';
import { DashboardBreadcrumb } from './dashboard-breadcrumb';
import { NavItem } from './nav-item';
import { SearchInput } from './search';
import { UserClerkButton } from './user-clerk-button';

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  const authUser: User | null = await currentUser();

  if (!authUser) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-full">
      <DesktopNav />
      <div className="flex-grow flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <MobileNav />
          <DashboardBreadcrumb />
          <SearchInput />
          <UserClerkButton />
        </header>
        <main className="flex-grow grid items-start gap-2 p-4 sm:px-6 sm:py-0 md:gap-4 bg-muted/40">
          <TransitionWrapper>{children}</TransitionWrapper>
        </main>
      </div>
      <Analytics />
    </div>
  );
}

async function DesktopNav() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.genealogist.findUnique({
    where: { clerkId: userId },
    select: { role: true }
  });

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden group w-14 hover:w-min flex-col border-r bg-background/60 backdrop-blur-sm sm:flex
      transition-[width] duration-100 hover:duration-100 ease-out hover:ease-in"
    >
      <nav className="flex flex-col items-center group-hover:items-start gap-4 px-0 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-full items-center gap-3 rounded-lg px-2 text-lg font-semibold"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Image className="h-4 w-4 transition-all group-hover:scale-110" src={"/icon.png"} alt='Logo' width={64} height={64} />
          </div>
          
        </Link>

        <NavItem href="/" label="Obituary Index">
          <Home className="h-5 w-5" />
        </NavItem>

        <NavItem href="/images" label="Obituary Images">
          <LucideImage className="h-5 w-5" />
        </NavItem>

        <NavItem href="/reports" label="Reports">
          <FileText className="h-5 w-5" />
        </NavItem>

        {user?.role === 'ADMIN' && (
          <NavItem href="/setup" label="Admin Setup">
            <Settings className="h-5 w-5" />
          </NavItem>
        )}
      </nav>
    </aside>
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
            href="/"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <Image className="h-4 w-4 transition-all group-hover:scale-110" src={"/icon.png"} alt='Logo' width={64} height={64} />

            <span className="sr-only">Obituary Dashboard</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-4 px-2.5 text-foreground"
          >
            <Home className="h-5 w-5" />
            Obituaries
          </Link>
          <Link
            href="/images"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <LucideImage className="h-5 w-5" />
            Images
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-5 w-5" />
            Reports
          </Link>
          <Link
            href="/setup"
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
