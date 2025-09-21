'use server';

import minioClient from '@/lib/minio-client';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function fetchReportsAction(page: number, perPage: number) {
  try {
    const skip = (page - 1) * perPage;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        skip,
        take: perPage,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          createdBy: {
            select: {
              fullName: true
            }
          }
        }
      }),
      prisma.report.count()
    ]);

    return { reports, total };
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw new Error('Failed to fetch reports');
  }
}

export async function deleteReportAction(reportId: string, fileName: string) {
  try {
    const bucketName = process.env.MINIO_BUCKET_NAME!;

    // Delete from Minio using the reports prefix
    await minioClient.removeObject(bucketName, `reports/${fileName}`);

    // Delete from database
    await prisma.report.delete({
      where: { id: reportId }
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    throw new Error('Failed to delete report');
  }
}

export async function getReportUrlAction(fileName: string) {
  try {
    const bucketName = process.env.MINIO_BUCKET_NAME!;

    return await minioClient.presignedGetObject(
      bucketName,
      `reports/${fileName}`,
      24 * 60 * 60 // URL valid for 1 day
    );
  } catch (error) {
    console.error('Error getting report URL:', error);
    throw new Error('Failed to get report URL');
  } finally {
    revalidatePath('/');
  }
}
