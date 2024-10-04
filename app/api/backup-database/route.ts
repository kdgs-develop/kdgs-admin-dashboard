import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `kdgs_database_${currentDate}_backup.json`;

    // Fetch all data from the database
    const data = await prisma.$transaction([
      prisma.obituary.findMany(),
      prisma.relative.findMany(),
      prisma.genealogist.findMany(),
      prisma.title.findMany(),
      prisma.city.findMany(),
      prisma.country.findMany(),
      prisma.periodical.findMany(),
      prisma.fileBox.findMany(),
      prisma.cemetery.findMany(),
      // Add any other models you need to backup
    ]);

    const backupData = {
      obituaries: data[0],
      relatives: data[1],
      genealogists: data[2],
      titles: data[3],
      cities: data[4],
      countries: data[5],
      periodicals: data[6],
      fileBoxes: data[7],
      cemeteries: data[8],
      // Add corresponding keys for any other models
    };

    const jsonData = JSON.stringify(backupData, null, 2);

    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=${fileName}`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Backup failed', details: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Backup failed', details: 'An unknown error occurred' }, { status: 500 });
    }
  }
}