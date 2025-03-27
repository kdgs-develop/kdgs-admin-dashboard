import "./globals.css";

import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";

export const metadata = {
  title: "KDGS Admin Dashboard",
  description:
    "Secure administrative interface for the Kelowna and District Genealogical Society. Manage obituaries, member records, and genealogical resources efficiently with this Next.js-powered dashboard, featuring Clerk authentication, Postgres database, and a responsive Tailwind CSS design.",
  copyright:
    "© 2025 Kelowna & District Genealogical Society | Developed by Javier Gongora o/a Vyoniq Technologies",
  creator: "Kelowna & District Genealogical Society",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isTemporaryUnavailable = true;

  if (isTemporaryUnavailable) {
    return (
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
        </head>
        <body className="bg-slate-50">
          <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-full w-full text-blue-600"
                  >
                    <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h1 className="mb-4 text-center text-2xl font-bold text-slate-800">
                KDGS Admin Dashboard
              </h1>

              {/* Status Badge */}
              <div className="mb-6 flex justify-center">
                <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500"></span>
                  Temporarily Unavailable
                </span>
              </div>

              {/* Message */}
              <div className="mb-6 text-center">
                <p className="mb-4 text-slate-600">
                  We are currently upgrading our systems to improve performance
                  and security.
                </p>
                <p className="font-medium text-slate-700">
                  The dashboard will be back online soon.
                </p>
              </div>

              {/* Progress indicator */}
              <div className="mb-6">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-3/4 animate-pulse rounded-full bg-blue-500"></div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-slate-500">
                <p>Thank you for your patience!</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="mb-1">
                    © {new Date().getFullYear()} Kelowna & District
                    Genealogical Society
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Developed by Javier Gongora — Vyoniq Technologies
                  </p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <Providers>
      <html lang="en">
        <body>
          <div className="pb-16">{children}</div>
          <Toaster />
          <Footer />
        </body>
      </html>
    </Providers>
  );
}
