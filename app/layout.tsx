import './globals.css';

import { Analytics } from '@vercel/analytics/react';
import { Toaster } from "@/components/ui/toaster";

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
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
