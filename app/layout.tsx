import './globals.css';

import { Toaster } from '@/components/ui/toaster';
import Providers from './(dashboard)/providers';

export const metadata = {
  title: 'KDGS Admin Dashboard',
  description:
    'A user admin dashboard configured with Next.js, Postgres, NextAuth, Tailwind CSS, TypeScript, and Prettier.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <html lang="en">
        <body>
          {children}
          <Toaster />
        </body>
      </html>
    </Providers>
  );
}
