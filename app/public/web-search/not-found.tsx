import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Obituary Not Found | KDGS Obituary Search",
  description: "The requested obituary was not found in the KDGS database."
};

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-8">
      <div className="max-w-xl w-full flex flex-col items-center space-y-8">
        <div className="w-full max-w-[200px]">
          <Image
            src="/kdgs.png"
            alt="KDGS Logo"
            width={200}
            height={80}
            priority
            className="mx-auto"
          />
        </div>

        <h1 className="text-2xl font-semibold text-gray-800 text-center">
          Obituary Not Found
        </h1>

        <div className="text-center">
          <p className="text-gray-600 mb-8">
            The obituary you're looking for does not exist or has been removed.
          </p>

          <Link
            href="/public/web-search"
            className="px-6 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Return to Search
          </Link>
        </div>
      </div>

      <footer className="mt-auto w-full text-center py-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} KDGS Database - All rights reserved
      </footer>
    </div>
  );
}
