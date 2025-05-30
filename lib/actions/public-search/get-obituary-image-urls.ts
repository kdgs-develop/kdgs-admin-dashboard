"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
  // Validate Input
  const validation = referenceSchema.safeParse(reference);
  if (!validation.success) {
    return { error: "Invalid input." };
  }
  const validReference = validation.data;

  try {
    // Fetch Obituary Image Data
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

    // Return the list of image keys (filenames)
    return { imageNames: imageKeys };
  } catch (error) {
    console.error("Error fetching image names for ref:", validReference, error);
    return { error: "An unexpected error occurred while fetching image list." };
  }
}
