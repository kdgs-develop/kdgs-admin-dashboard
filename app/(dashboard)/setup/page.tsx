import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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

export default async function SetupPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.genealogist.findUnique({
    where: { clerkId: userId }
  });

  if (user?.role !== "ADMIN" && user?.role !== "PROCESS_MANAGER")
    redirect("/dashboard");

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="container mx-auto px-4 max-w-[calc(4xl)]">
      <div className="space-y-6 mt-4">
        <Card className="w-[calc(100%)]">
          <CardHeader>
            <CardTitle>System Administration</CardTitle>
            <CardDescription>
              Manage file boxes, batch numbers, and other system configurations.
            </CardDescription>
            <CardContent className="space-y-4 pt-4 px-0">
              <FileBoxAdministration />
              <BatchNumberAdministration />
              {isAdmin && (
                <>
                  <BulkUpload />
                  <OrdersAdministration />
                  <CountryAdministration />
                  <LocationAdministration />
                  <PeriodicalAdministration />
                  <RelationshipAdministration />
                  <CemeteryAdministration />
                  <TitleAdministration />
                  <GenealogistAdministration />
                  <AdminBackup />
                </>
              )}
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
