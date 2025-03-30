import Image from "next/image";
import { SearchForm } from "./components/search-form";

export const metadata = {
  title: "KDGS Obituary Search",
  description: "Search for obituaries in the KDGS database"
};

export default function WebSearchPage() {
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
          Obituary Search
        </h1>

        <div className="w-full">
          <SearchForm />
        </div>

        <p className="text-sm text-gray-500 text-center mt-8">
          Search for obituaries by entering a person's given name(s) and/or
          surname(s).
        </p>
      </div>

      <footer className="mt-auto w-full text-center py-4 text-gray-500 text-sm">
        © {new Date().getFullYear()} KDGS Database - All rights reserved
      </footer>
    </div>
  );
}
