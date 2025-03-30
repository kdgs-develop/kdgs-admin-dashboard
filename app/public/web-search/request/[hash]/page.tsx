import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { getObituaryByHash } from "../../lib/actions";
import { RequestForm } from "./components/request-form";

interface RequestPageProps {
  params: {
    hash: string;
  };
  searchParams: {
    canceled?: string;
  };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: RequestPageProps) {
  const obituary = await getObituaryByHash(params.hash);

  if (!obituary) {
    return {
      title: "Obituary Not Found",
      description: "The requested obituary was not found."
    };
  }

  const fullName = [obituary.title?.name, obituary.givenNames, obituary.surname]
    .filter(Boolean)
    .join(" ");

  return {
    title: `Request Obituary for ${fullName}`,
    description: `Request the obituary file for ${fullName} from the KDGS database.`
  };
}

export default async function RequestPage({
  params,
  searchParams
}: RequestPageProps) {
  const obituary = await getObituaryByHash(params.hash);

  if (!obituary) {
    notFound();
  }

  const canRequestObituary =
    obituary.proofread &&
    (obituary.imageNames?.length > 0 || obituary.fileImages?.length > 0);

  if (!canRequestObituary) {
    redirect("/public/web-search");
  }

  const fullName = [obituary.title?.name, obituary.givenNames, obituary.surname]
    .filter(Boolean)
    .join(" ");

  const deathDate = obituary.deathDate
    ? format(new Date(obituary.deathDate), "MMMM d, yyyy")
    : "Unknown";

  const wasCanceled = searchParams.canceled === "true";

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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Request Obituary
          </h1>

          {wasCanceled && (
            <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-md">
              Your previous payment was canceled. You can try again using the
              form below.
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              Obituary Details
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{fullName}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Reference</p>
                  <p className="text-gray-900">{obituary.reference}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Date of Death
                  </p>
                  <p className="text-gray-900">{deathDate}</p>
                </div>
              </div>

              {obituary.birthDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </p>
                  <p className="text-gray-900">
                    {format(new Date(obituary.birthDate), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">
              Payment Details
            </h2>

            <p className="mb-6 text-gray-600">
              To receive the obituary files via email, please complete the
              payment process. The cost is $5.00 CAD per obituary.
            </p>

            <RequestForm obituary={obituary} />
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 px-4 py-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} KDGS Database - All rights reserved
      </footer>
    </div>
  );
}
