import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import {
  FileText,
  Users,
  ImageIcon,
  Shield,
  Database,
  Mail
} from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Column - Branding and Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[#003B5C] bg-[url('/duck-lake.jpg')] bg-cover bg-center"></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            {/* Logo and Title */}
            <div className="mb-8">
              <Image
                src="/kdgs.png"
                alt="KDGS Logo"
                width={180}
                height={60}
                className="mb-6"
                priority
              />
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-xl text-gray-200">
                Kelowna & District Genealogical Society
              </p>
            </div>

            {/* Welcome Message */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Welcome Back!</h2>
              <p className="text-gray-200 leading-relaxed">
                Access your comprehensive genealogy management system to manage
                obituaries, genealogical resources, and administrative functions
                efficiently.
              </p>
            </div>

            {/* Key Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Key Features:</h3>
              <div className="grid gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-sm">
                    Complete obituary management system
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">
                    Advanced image processing and storage
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Role-based user management</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-2 rounded-lg">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-sm">
                    Secure authentication and permissions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-teal-500 p-2 rounded-lg">
                    <Database className="h-4 w-4" />
                  </div>
                  <span className="text-sm">
                    PostgreSQL database with real-time sync
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-2 rounded-lg">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Automated email notifications</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-gray-300">
                Powered by Vyoniq Technologies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 min-h-screen">
        <div className="w-full max-w-md">
          {/* Mobile Header - Only show on mobile */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/kdgs.png"
              alt="KDGS Logo"
              width={150}
              height={50}
              className="mx-auto mb-4"
              priority
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Kelowna & District Genealogical Society
            </p>
          </div>

          <SignIn
            appearance={{
              elements: {
                footerAction: "hidden",
                card: {
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                },
                headerTitle: {
                  color: "#111827",
                  fontSize: "1.5rem",
                  fontWeight: "600"
                },
                formButtonPrimary: {
                  backgroundColor: "#003B5C",
                  border: "none",
                  borderRadius: "0.375rem"
                },
                formButtonPrimary__loading: {
                  backgroundColor: "#003B5C"
                },
                formFieldInput: {
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 0.75rem"
                },
                formFieldInput__focus: {
                  borderColor: "#003B5C",
                  boxShadow: "0 0 0 1px #003B5C"
                },
                footerActionText: {
                  color: "#6b7280"
                }
              }
            }}
            routing="hash"
          />
        </div>
      </div>
    </div>
  );
}
