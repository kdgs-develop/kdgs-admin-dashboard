import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session"; // Your session config
import { cookies } from "next/headers";
import { logout } from "@/lib/actions/auth/logout";
import Link from "next/link";
import Image from "next/image";
import { HeaderAuth } from "./components/header-auth"; // Import the new component

// Layout becomes an async component to fetch session
export default async function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  // Create a plain object for the session data to pass to the client component
  const plainSessionData: SessionData | null = session.isLoggedIn
    ? {
        isLoggedIn: session.isLoggedIn,
        username: session.username,
        displayName: session.displayName
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#0f4c81] sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/kdgs.png"
                alt="KDGS Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/public/search"
                className="text-white hover:text-gray-200"
              >
                Kelowna & District Genealogical Society
              </Link>
              {/* Add other relevant public nav links */}
              {/* <Link href="#" className="text-white hover:text-gray-200">
                About
              </Link>
              <Link href="#" className="text-white hover:text-gray-200">
                Help
              </Link> */}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <HeaderAuth session={plainSessionData} />
            <a
              href="https://kdgs.ca/membership/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors hidden md:inline-block"
            >
              Become a Member
            </a>
          </div>
        </div>
      </header>

      {/* Wrap children in a main element that grows */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
