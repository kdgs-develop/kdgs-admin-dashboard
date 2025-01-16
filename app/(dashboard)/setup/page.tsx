import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AdminBackup } from './admin-backup';
import { BulkUpload } from './bulk-upload';
import { GenealogistAdministration } from './genealogist-administration';
import { LocationAdministration } from './location-administration';
import { CemeteryAdministration } from './cemetery-administration';
import { CountryAdministration } from './country-administration';
import { FileBoxAdministration } from './filebox-administration';
import { PeriodicalAdministration } from './periodical-administration';
import { TitleAdministration } from './title-administration';
import { RelationshipAdministration } from './relationship-administration';

export default async function SetupPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.genealogist.findUnique({
    where: { clerkId: userId }
  });

  if (user?.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="container mx-auto px-4 max-w-[calc(4xl)]">
      <div className="space-y-6 mt-4">
        <Card className="w-[calc(100%)]">
          <CardHeader>
            <CardTitle>Admin Setup</CardTitle>
            <CardDescription>
              Configure your obituary management system.
            </CardDescription>
            <CardContent className="space-y-4 pt-4 px-0">
              <BulkUpload />

              <FileBoxAdministration />

              <CountryAdministration />

              <LocationAdministration />
              
              <PeriodicalAdministration />

              <RelationshipAdministration />

              <CemeteryAdministration />

              <TitleAdministration />

              <GenealogistAdministration />

              <AdminBackup />
             
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
