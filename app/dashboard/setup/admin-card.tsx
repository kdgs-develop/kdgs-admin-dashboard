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
  className = ""
}: AdminCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = iconMap[iconName as keyof typeof iconMap];

  return (
    <>
      <Card className={`h-full flex flex-col ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
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
        <CardContent className="flex-1 flex flex-col justify-between">
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <div className="mt-4">{children}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
