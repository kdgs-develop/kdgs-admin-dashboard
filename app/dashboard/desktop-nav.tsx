"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import {
  ChevronRight,
  FileText,
  Home,
  Image as LucideImage,
  Settings
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { NavItem } from "./nav-item";

interface DesktopNavProps {
  role: Role;
}

export function DesktopNav({ role }: DesktopNavProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <aside
      className={cn(
        "hidden nav:flex flex-col border-r min-h-screen pt-2 overflow-hidden",
        "transition-[width] duration-300 ease-in-out",
        isOpen ? "w-[135px]" : "w-14",
        "bg-background"
      )}
    >
      <nav className="flex flex-col px-1 py-2.5 pl-2.5 sticky top-0">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-2 py-2 mb-2",
              isOpen ? "w-full justify-start" : "w-10 justify-center"
            )}
          >
            <div className="flex items-center justify-center shrink-0">
              <Image
                className={cn(
                  "transition-all duration-300",
                  isOpen ? "h-8 w-auto" : "h-6 w-auto"
                )}
                src="/kdgs.png"
                alt="KDGS Logo"
                width={120}
                height={40}
                priority
                unoptimized
              />
            </div>
          </Link>

          <NavItem href="/dashboard" label="Index" isOpen={isOpen}>
            <Home className="h-5 w-5" />
          </NavItem>

          <NavItem href="/dashboard/images" label="Images" isOpen={isOpen}>
            <LucideImage className="h-5 w-5" />
          </NavItem>

          {role !== "VIEWER" && (
            <NavItem href="/dashboard/reports" label="Reports" isOpen={isOpen}>
              <FileText className="h-5 w-5" />
            </NavItem>
          )}

          {role === "ADMIN" && (
            <NavItem href="/dashboard/setup" label="Admin" isOpen={isOpen}>
              <Settings className="h-5 w-5" />
            </NavItem>
          )}

          <div className="flex items-center justify-end mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="hover:bg-accent"
            >
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  );
}
