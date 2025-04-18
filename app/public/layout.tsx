import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session"; // Your session config
import { cookies } from "next/headers";
import { logout } from "@/lib/actions/auth/logout";
import Link from "next/link";
import { HeaderAuth } from "./components/header-auth"; // Import the new component

// Layout becomes an async component to fetch session
export default async function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#003B5C]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-white">
              KDGS
            </Link>
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/public/search"
                className="text-white hover:text-gray-200"
              >
                Search Records
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
          <HeaderAuth session={session} logoutAction={logout} />
        </div>
      </header>
      {children}
    </div>
  );
}
