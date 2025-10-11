import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminCard } from "./admin-card";
import { AdminBackup } from "./admin-backup";
import { BatchNumberAdministration } from "./batch-number-administration";
import { BulkUpload } from "./bulk-upload";
import { CemeteryAdministration } from "./cemetery-administration";
import { CountryAdministration } from "./country-administration";
import { FileBoxAdministration } from "./filebox-administration";
import { GenealogistAdministration } from "./genealogist-administration";
import { LocationAdministration } from "./location-administration";
import { OrdersAdministration } from "./orders-administration";
import { PeriodicalAdministration } from "./periodical-administration";
import { RelationshipAdministration } from "./relationship-administration";
import { TitleAdministration } from "./title-administration";
import { SharedDataProvider } from "./shared-data-context";

export default async function SetupPage() {
  const { userId } = auth();
  if (!userId) redirect("/login");

  const user = await prisma.genealogist.findUnique({
    where: { clerkId: userId }
  });

  if (user?.role !== "ADMIN" && user?.role !== "PROCESS_MANAGER")
    redirect("/dashboard");

  const isAdmin = user?.role === "ADMIN";

  const coreManagementCards = [
    {
      title: "File Boxes",
      description: "Manage file box assignments and tracking",
      iconName: "Archive",
      component: <FileBoxAdministration />,
      colorScheme: "blue" as const
    },
    {
      title: "Batch Numbers",
      description: "Create and manage batch number assignments",
      iconName: "BarChart3",
      component: <BatchNumberAdministration />,
      colorScheme: "blue" as const
    }
  ];

  const dataManagementCards = [
    {
      title: "Countries",
      description: "Manage country reference data",
      iconName: "Globe",
      component: <CountryAdministration />,
      isAdminOnly: true,
      colorScheme: "green" as const
    },
    {
      title: "Locations",
      description: "Manage city and location data",
      iconName: "MapPin",
      component: <LocationAdministration />,
      isAdminOnly: true,
      colorScheme: "green" as const
    },
    {
      title: "Publications",
      description: "Manage newspaper and periodical references",
      iconName: "Newspaper",
      component: <PeriodicalAdministration />,
      isAdminOnly: true,
      colorScheme: "green" as const
    },
    {
      title: "Relationships",
      description: "Manage family relationship types",
      iconName: "UserCheck",
      component: <RelationshipAdministration />,
      isAdminOnly: true,
      colorScheme: "green" as const
    },
    {
      title: "Interment Places",
      description: "Manage cemetery and interment location information",
      iconName: "Building2",
      component: <CemeteryAdministration />,
      isAdminOnly: true,
      colorScheme: "green" as const
    },
    {
      title: "Titles",
      description: "Manage professional and honorary titles",
      iconName: "FileText",
      component: <TitleAdministration />,
      isAdminOnly: true,
      colorScheme: "green" as const
    }
  ];

  const userManagementCards = [
    {
      title: "Genealogists",
      description: "Manage user accounts and permissions",
      iconName: "Users",
      component: <GenealogistAdministration />,
      isAdminOnly: true,
      colorScheme: "purple" as const
    },
    {
      title: "Orders",
      description: "View and manage customer orders",
      iconName: "Database",
      component: <OrdersAdministration />,
      isAdminOnly: true,
      colorScheme: "purple" as const
    }
  ];

  const systemToolsCards = [
    {
      title: "Bulk Upload",
      description: "Upload multiple files and images at once",
      iconName: "Upload",
      component: <BulkUpload />,
      isAdminOnly: true,
      colorScheme: "amber" as const
    },
    {
      title: "System Backup",
      description: "Create and manage database backups",
      iconName: "Settings",
      component: <AdminBackup />,
      isAdminOnly: true,
      colorScheme: "amber" as const
    }
  ];

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <div className="space-y-8 mt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Administration
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage file boxes, batch numbers, and other system configurations.
          </p>
        </div>

        {/* Core Management */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Core Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreManagementCards.map(card => (
              <AdminCard
                key={card.title}
                title={card.title}
                description={card.description}
                iconName={card.iconName}
                colorScheme={card.colorScheme}
              >
                {card.component}
              </AdminCard>
            ))}
          </div>
        </div>

        {/* Data Management */}
        {isAdmin && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Reference Data</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dataManagementCards.map(card => (
                <AdminCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  iconName={card.iconName}
                  isAdminOnly={card.isAdminOnly}
                  colorScheme={card.colorScheme}
                >
                  <SharedDataProvider>{card.component}</SharedDataProvider>
                </AdminCard>
              ))}
            </div>
          </div>
        )}

        {/* User Management */}
        {isAdmin && (
          <div>
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userManagementCards.map(card => (
                <AdminCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  iconName={card.iconName}
                  isAdminOnly={card.isAdminOnly}
                  colorScheme={card.colorScheme}
                >
                  <SharedDataProvider>{card.component}</SharedDataProvider>
                </AdminCard>
              ))}
            </div>
          </div>
        )}

        {/* System Tools */}
        {isAdmin && (
          <div>
            <h2 className="text-xl font-semibold mb-4">System Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {systemToolsCards.map(card => (
                <AdminCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  iconName={card.iconName}
                  isAdminOnly={card.isAdminOnly}
                  colorScheme={card.colorScheme}
                >
                  <SharedDataProvider>{card.component}</SharedDataProvider>
                </AdminCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
