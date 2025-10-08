"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Archive,
  BarChart3,
  Building2,
  Database,
  FileText,
  Globe,
  MapPin,
  Newspaper,
  Settings,
  Upload,
  Users,
  UserCheck
} from "lucide-react";

interface AdminCardProps {
  title: string;
  description: string;
  iconName: string;
  stats?: {
    label: string;
    value: string | number;
  }[];
  children: React.ReactNode;
  isAdminOnly?: boolean;
  className?: string;
  colorScheme?: "blue" | "green" | "purple" | "amber";
}

const iconMap = {
  Archive,
  BarChart3,
  Building2,
  Database,
  FileText,
  Globe,
  MapPin,
  Newspaper,
  Settings,
  Upload,
  Users,
  UserCheck
};

export function AdminCard({
  title,
  description,
  iconName,
  stats = [],
  children,
  isAdminOnly = false,
  className = "",
  colorScheme = "blue"
}: AdminCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = iconMap[iconName as keyof typeof iconMap];

  // Define color schemes with subtle, professional colors
  const colorSchemes = {
    blue: {
      card: "bg-blue-50/50 border-blue-100",
      icon: "bg-blue-100",
      iconColor: "text-blue-600",
      stats: "text-blue-700"
    },
    green: {
      card: "bg-emerald-50/50 border-emerald-100",
      icon: "bg-emerald-100",
      iconColor: "text-emerald-600",
      stats: "text-emerald-700"
    },
    purple: {
      card: "bg-purple-50/50 border-purple-100",
      icon: "bg-purple-100",
      iconColor: "text-purple-600",
      stats: "text-purple-700"
    },
    amber: {
      card: "bg-amber-50/50 border-amber-100",
      icon: "bg-amber-100",
      iconColor: "text-amber-600",
      stats: "text-amber-700"
    }
  };

  const colors = colorSchemes[colorScheme];

  return (
    <>
      <Card className={`h-full flex flex-col ${colors.card} ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${colors.icon} rounded-lg`}>
                <Icon className={`h-5 w-5 ${colors.iconColor}`} />
              </div>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                {isAdminOnly && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Admin Only
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <CardDescription className="text-sm mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-full"
            variant="outline"
          >
            Manage {title}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">{children}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
