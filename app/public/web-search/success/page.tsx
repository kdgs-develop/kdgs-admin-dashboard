import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PaymentStatus } from "./components/payment-status";

export const metadata = {
  title: "Payment Successful | KDGS Obituary Search",
  description:
    "Your payment was successful. The obituary files will be sent to your email."
};

interface SuccessPageProps {
  searchParams: {
    session_id?: string;
  };
}

export default function SuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    redirect("/public/web-search");
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <Link href="/public/web-search" className="shrink-0">
            <Image
              src="/kdgs.png"
              alt="KDGS Logo"
              width={120}
              height={48}
              priority
              className="h-12 w-auto"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <PaymentStatus sessionId={sessionId} />
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/public/web-search"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Return to search
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 px-4 py-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} KDGS Database - All rights reserved
      </footer>
    </div>
  );
}
