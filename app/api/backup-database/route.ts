import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST() {
  const currentDate = new Date().toISOString().split('T')[0];
  const fileName = `kdgs_database_${currentDate}_dump`;

  const pgDump = spawn('pg_dump', [
    '-Fc',
    '-v',
    '-d',
    'postgresql://postgres:Magnetize_Staging_Unleveled2@rds.kdgs.canhost.ca:5432/kdgs_dashboard'
  ]);

  const chunks = [];

  for await (const chunk of pgDump.stdout) {
    chunks.push(chunk);
  }

  const stderr = [];
  for await (const chunk of pgDump.stderr) {
    stderr.push(chunk);
  }

  console.log('pg_dump stderr:', Buffer.concat(stderr).toString());

  return new NextResponse(Buffer.concat(chunks), {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${fileName}`,
    },
  });
}