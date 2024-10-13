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
import { GeneaologistAdministration } from './genealogist-administration';
import { LocationAdministration } from './location-administration';

export default async function SetupPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.genealogist.findUnique({
    where: { clerkId: userId }
  });

  if (user?.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="container mx-auto px-4 max-w-[calc(4xl)]">
      <div className="space-y-6">
        <Card className="w-[calc(100%)]">
          <CardHeader>
            <CardTitle>Admin Setup</CardTitle>
            <CardDescription>
              Configure your obituary management system.
            </CardDescription>
          </CardHeader>
        </Card>

        <LocationAdministration />

        <GeneaologistAdministration />

        <BulkUpload />

        <Card className="w-[calc(100%)]">
          <CardHeader>
            <CardTitle>Database Backup</CardTitle>
            <CardDescription>
              Download a backup of your database content and learn how to create
              manual backups.
            </CardDescription>
          </CardHeader>

          <CardContent className="text-sm text-muted-foreground">
            <div className="space-y-4">
              <AdminBackup />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
