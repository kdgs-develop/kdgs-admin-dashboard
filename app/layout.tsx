import "./globals.css";

import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";

export const metadata = {
  title: "KDGS Admin Dashboard",
  description:
    "Secure administrative interface for the Kelowna and District Genealogical Society. Manage obituaries, member records, and genealogical resources efficiently with this Next.js-powered dashboard, featuring Clerk authentication, Postgres database, and a responsive Tailwind CSS design.",
  copyright: `© ${new Date().getFullYear()} Kelowna & District Genealogical Society | Powered by Vyoniq Technologies`,
  creator: "Kelowna & District Genealogical Society",
  icons: {
    icon: [
      {
        url: "/kdgs.png",
        sizes: "32x32",
        type: "image/png"
      }
    ],
    shortcut: "/kdgs.png",
    apple: "/kdgs.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Read from environment variable with a fallback to false
  const isTemporaryUnavailable =
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" || false;

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
                    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6-3v13m6-13l-5.447-2.724A1 1 0 0115 3.618v10.764a1 1 0 01-1.447.894L9 13" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h1 className="mb-4 text-center text-2xl font-bold text-slate-800">
                KDGS Admin Dashboard
              </h1>

              {/* Status Badge */}
              <div className="mb-6 flex justify-center">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
                  We've Moved
                </span>
              </div>

              {/* Message */}
              <div className="mb-6 text-center">
                <p className="mb-4 text-slate-600">
                  The KDGS Admin Dashboard has been moved to a more secure host.
                </p>
                <p className="font-medium text-slate-700 mb-4">
                  Please update your bookmarks to use the new address.
                </p>
                <a
                  href="https://search.kdgs.ca"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Go to search.kdgs.ca
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-2 h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>

              {/* Changed to a divider instead of progress indicator */}
              <div className="mb-6 flex items-center">
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-slate-500">
                <p>Thank you for visiting!</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="mb-1">
                    © {new Date().getFullYear()} Kelowna & District
                    Genealogical Society
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Powered by Vyoniq Technologies
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
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover"
          />
          <link rel="icon" href="/kdgs.png" type="image/png" />
          <link rel="shortcut icon" href="/kdgs.png" type="image/png" />
          <link rel="apple-touch-icon" href="/kdgs.png" />
        </head>
        <body>
          {children}
          <Toaster />
        </body>
      </html>
    </Providers>
  );
}
