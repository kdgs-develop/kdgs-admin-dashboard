import { Button } from "@/components/ui/button";

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#003B5C]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="text-2xl font-bold text-white">
              KDGS
            </a>
            <nav className="hidden md:flex space-x-4">
              <a
                href="/public/search"
                className="text-white hover:text-gray-200"
              >
                Search Records
              </a>
              <a href="#" className="text-white hover:text-gray-200">
                About
              </a>
              <a href="#" className="text-white hover:text-gray-200">
                Help
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="text-white hover:text-gray-200 hover:bg-[#004d7a]"
            >
              Sign In
            </Button>
            <Button className="bg-[#8B0000] hover:bg-[#6d0000] text-white border-none">
              Become a Member
            </Button>
          </div>
        </div>
      </header>
      {children}
      <footer className="mt-auto bg-[#003B5C] py-8">
        <div className="container mx-auto px-4 text-center text-white">
          <p>&copy; {new Date().getFullYear()} KDGS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
