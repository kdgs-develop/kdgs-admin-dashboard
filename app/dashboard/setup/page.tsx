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
import { getAdminStats } from "./admin-stats";

export default async function SetupPage() {
  const { userId } = auth();
  if (!userId) redirect("/login");

  const user = await prisma.genealogist.findUnique({
    where: { clerkId: userId }
  });

  if (user?.role !== "ADMIN" && user?.role !== "PROCESS_MANAGER")
    redirect("/dashboard");

  const isAdmin = user?.role === "ADMIN";
  const stats = await getAdminStats();

  const coreManagementCards = [
    {
      title: "File Boxes",
      description: "Manage file box assignments and tracking",
      iconName: "Archive",
      stats: [{ label: "Total File Boxes", value: stats.fileBoxes.count }],
      component: <FileBoxAdministration />
    },
    {
      title: "Batch Numbers",
      description: "Create and manage batch number assignments",
      iconName: "BarChart3",
      stats: [{ label: "Total Batches", value: stats.batchNumbers.count }],
      component: <BatchNumberAdministration />
    }
  ];

  const dataManagementCards = [
    {
      title: "Countries",
      description: "Manage country reference data",
      iconName: "Globe",
      stats: [{ label: "Countries", value: stats.countries.count }],
      component: <CountryAdministration />,
      isAdminOnly: true
    },
    {
      title: "Locations",
      description: "Manage city and location data",
      iconName: "MapPin",
      stats: [{ label: "Locations", value: stats.locations.count }],
      component: <LocationAdministration />,
      isAdminOnly: true
    },
    {
      title: "Publications",
      description: "Manage newspaper and periodical references",
      iconName: "Newspaper",
      stats: [{ label: "Publications", value: stats.periodicals.count }],
      component: <PeriodicalAdministration />,
      isAdminOnly: true
    },
    {
      title: "Relationships",
      description: "Manage family relationship types",
      iconName: "UserCheck",
      stats: [{ label: "Relationships", value: stats.relationships.count }],
      component: <RelationshipAdministration />,
      isAdminOnly: true
    },
    {
      title: "Cemeteries",
      description: "Manage cemetery information",
      iconName: "Building2",
      stats: [{ label: "Cemeteries", value: stats.cemeteries.count }],
      component: <CemeteryAdministration />,
      isAdminOnly: true
    },
    {
      title: "Titles",
      description: "Manage professional and honorary titles",
      iconName: "FileText",
      stats: [{ label: "Titles", value: stats.titles.count }],
      component: <TitleAdministration />,
      isAdminOnly: true
    }
  ];

  const userManagementCards = [
    {
      title: "Genealogists",
      description: "Manage user accounts and permissions",
      iconName: "Users",
      stats: [{ label: "Users", value: stats.genealogists.count }],
      component: <GenealogistAdministration />,
      isAdminOnly: true
    },
    {
      title: "Orders",
      description: "View and manage customer orders",
      iconName: "Database",
      stats: [{ label: "Orders", value: stats.orders.count }],
      component: <OrdersAdministration />,
      isAdminOnly: true
    }
  ];

  const systemToolsCards = [
    {
      title: "Bulk Upload",
      description: "Upload multiple files and images at once",
      iconName: "Upload",
      component: <BulkUpload />,
      isAdminOnly: true
    },
    {
      title: "System Backup",
      description: "Create and manage database backups",
      iconName: "Settings",
      component: <AdminBackup />,
      isAdminOnly: true
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
                stats={card.stats}
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
                  stats={card.stats}
                  isAdminOnly={card.isAdminOnly}
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
                  stats={card.stats}
                  isAdminOnly={card.isAdminOnly}
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
