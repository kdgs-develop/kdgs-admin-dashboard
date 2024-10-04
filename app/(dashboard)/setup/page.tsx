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
import { DatabaseBackup } from './database-backup';
import { GeneaologistAdministration } from './genealogist-administration';

export default async function SetupPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.genealogist.findUnique({
    where: { clerkId: userId }
  });

  if (user?.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="container mx-auto px-4 max-w-[calc(4xl)]">
      <Card className="w-[calc(100%)]">
        <CardHeader>
          <CardTitle>Setup</CardTitle>
          <CardDescription>
            Configure your obituary management system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GeneaologistAdministration />
        </CardContent>
      </Card>

      <Card className="w-[calc(100%)]">
        <CardHeader>
          <CardTitle>Database Backup</CardTitle>
          <CardDescription>
            Download a backup of your database in PostgreSQL custom format
            (.dump file). This file contains a complete snapshot of your
            database and can be used to restore the database in case of data
            loss or when migrating to a new server.
            <br />
            <br />
            To restore the database using this dump file, use the following
            command:
            <br />
            <code className="bg-gray-100 p-1 rounded">
              pg_restore -d [DATABASE_URL] -c -v [PATH_TO_DUMP_FILE]
            </code>
            <br />
            <br />
            Replace [DATABASE_URL] with your database connection string and
            [PATH_TO_DUMP_FILE] with the path to the downloaded dump file.
            <br />
            <br />
            It's recommended to perform regular backups and store them securely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DatabaseBackup />
        </CardContent>
      </Card>
    </div>
  );
}
