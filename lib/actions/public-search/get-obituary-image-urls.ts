"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { cookies } from "next/headers";
// No longer need getImageUrlAction here
// import { getImageUrlAction } from "@/app/(dashboard)/images/minio-actions";

const referenceSchema = z.string().min(1, "Obituary reference is required");

// No longer need DownloadItem interface
// interface DownloadItem {
//   url: string;
//   filename: string;
// }

// Update return type to only include filenames (imageNames)
export async function getObituaryImageUrls(reference: unknown): Promise<{
  imageNames?: string[];
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
        imageNames: true
      }
    });

    if (!obituary) {
      return { error: "Obituary not found." };
    }

    const imageKeys = obituary.imageNames ?? [];

    if (imageKeys.length === 0) {
      return { message: "No images associated with this obituary." };
    }

    // 4. Simply return the list of image keys (filenames)
    return { imageNames: imageKeys };
  } catch (error) {
    console.error("Error fetching image names for ref:", validReference, error);
    return { error: "An unexpected error occurred while fetching image list." };
  }
}
