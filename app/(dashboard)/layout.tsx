import Image from 'next/image';
import { VercelLogo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { prisma } from '@/lib/prisma';
import { auth, currentUser, User } from '@clerk/nextjs/server';
import { Analytics } from '@vercel/analytics/react';
import { Home, Image as LucideImage, Package2, PanelLeft, Settings } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DashboardBreadcrumb } from './dashboard-breadcrumb';
import { NavItem } from './nav-item';
import { TransitionWrapper } from './providers';
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
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          
          <Image className="h-4 w-4 transition-all group-hover:scale-110" src={"/icon.png"} alt='Logo' width={64} height={64} />
          
          <span className="sr-only">Obituary Dashboard</span>
        </Link>

        <NavItem href="/" label="Obituary Index">
          <Home className="h-5 w-5" />
        </NavItem>

        <NavItem href="/images" label="Obituary Images">
          <LucideImage className="h-5 w-5" />
        </NavItem>
        {user?.role === 'ADMIN' && (
          <NavItem href="/setup" label="Setup">
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
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
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
            Obituary Images
          </Link>
          <Link
            href="/setup"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            Setup
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
