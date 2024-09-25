import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GeneaologistAdministration } from './genealogist-administration';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function SetupPage() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  const user = await prisma.genealogist.findUnique({
    where: { clerkId: userId },
  });

  if (user?.role !== 'ADMIN') redirect('/dashboard');

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Setup</CardTitle>
          <CardDescription>Configure your obituary management system.</CardDescription>
        </CardHeader>
        <CardContent>
          <GeneaologistAdministration />
        </CardContent>
      </Card>
    </div>
  );
}