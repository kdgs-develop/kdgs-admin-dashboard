import './globals.css';

import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import Providers from './providers';

export const metadata = {
  title: 'KDGS Admin Dashboard',
  description:
    'Secure administrative interface for the Kelowna and District Genealogical Society. Manage obituaries, member records, and genealogical resources efficiently with this Next.js-powered dashboard, featuring Clerk authentication, Postgres database, and a responsive Tailwind CSS design.',
  copyright: '© 2024 Kelowna & District Genealogical Society | Developed by Javier Gongora o/a Vyoniq Technologies',
  creator: 'Kelowna & District Genealogical Society'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <html lang="en" className="h-full">
        <body className="flex flex-col min-h-full">
          <link rel="icon" href="/icon.png" sizes="any" />
          <div className="flex-grow">{children}</div>
          <Toaster />
          <Footer />
        </body>
      </html>
    </Providers>
  );
}
