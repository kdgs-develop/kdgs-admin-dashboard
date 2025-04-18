"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";
// Import the existing action to generate URLs
import { getImageUrlAction } from "@/app/(dashboard)/images/minio-actions";
// TODO: Import your cloud storage SDK (e.g., AWS S3, Google Cloud Storage)
// import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const referenceSchema = z.string().min(1, "Obituary reference is required");

// TODO: Initialize your cloud storage client
// const s3Client = new S3Client({ region: process.env.AWS_REGION });
// const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Define the structure for download items
interface DownloadItem {
  url: string;
  filename: string;
}

export async function getObituaryImageUrls(reference: unknown): Promise<{
  downloads?: DownloadItem[]; // Update return type
  error?: string;
  message?: string;
}> {
  // 1. Verify Authentication
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    return { error: "Authentication required." };
  }

  // 2. Validate Input
  const validation = referenceSchema.safeParse(reference);
  if (!validation.success) {
    return { error: "Invalid input." };
  }
  const validReference = validation.data;

  try {
    // 3. Fetch Obituary Image Data
    const obituary = await prisma.obituary.findUnique({
      where: { reference: validReference },
      select: {
        imageNames: true // Assuming this array holds the keys/filenames in storage
        // Or select the actual relations if needed:
        // images: { select: { storageKey: true } }, // Example if using relations
        // fileImages: { select: { storageKey: true } },
      }
    });

    if (!obituary) {
      return { error: "Obituary not found." };
    }

    // Use imageNames array as the source of truth for filenames/keys
    const imageKeys = obituary.imageNames ?? [];

    if (imageKeys.length === 0) {
      return { message: "No images associated with this obituary." }; // Not an error, but no URLs
    }

    // 4. Generate Pre-signed URLs and pair with filenames
    const downloadItems: DownloadItem[] = [];
    for (const key of imageKeys) {
      try {
        const url = await getImageUrlAction(key);
        if (typeof url === "string") {
          downloadItems.push({ url: url, filename: key });
        } else {
          // Handle cases where getImageUrlAction might not return a string (though unlikely based on read code)
          console.warn(`Could not generate URL for key: ${key}`);
        }
      } catch (urlError) {
        console.error(`Error generating URL for key ${key}:`, urlError);
        // Optionally decide if one failed URL should stop the whole process
        // For now, we'll log and continue, returning only successful URLs
      }
    }

    if (downloadItems.length === 0) {
      return { error: "Could not generate any download URLs." };
    }

    // Return the array of download items
    return { downloads: downloadItems };
  } catch (error) {
    console.error(
      "Error generating download URLs for ref:",
      validReference,
      error
    );
    // Check if error came from getImageUrlAction or elsewhere
    if (
      error instanceof Error &&
      error.message.startsWith("Failed to get image URL")
    ) {
      return { error: "Failed to generate one or more download links." };
    }
    return {
      error: "An unexpected error occurred while preparing download links."
    };
  }
}
