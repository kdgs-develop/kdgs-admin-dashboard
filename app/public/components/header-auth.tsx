"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserNav } from "./user-nav";
import { LoginDialog } from "./login-dialog";
import Link from "next/link";
import { SessionData } from "@/lib/session"; // Import the session data type

interface HeaderAuthProps {
  session: SessionData | null; // Session can be null if not logged in
}

export function HeaderAuth({ session }: HeaderAuthProps) {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-4">
        {session?.isLoggedIn ? (
          <>
            {/* Display user info */}
            <UserNav
              displayName={session.displayName}
              username={session.username}
            />
          </>
        ) : (
          <>
            {/* Login Button */}
            <Button
              variant="ghost"
              className="text-white hover:text-gray-200 hover:bg-[#004d7a]"
              onClick={() => setIsLoginDialogOpen(true)} // Open the dialog
            >
              Sign In
            </Button>
          </>
        )}
      </div>

      {/* Login Dialog (conditionally rendered but controlled by state) */}
      <LoginDialog
        isOpen={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
      />
    </>
  );
}
 