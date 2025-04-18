"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const referenceSchema = z.string().min(1, "Obituary reference is required");

export interface ObituaryDetails {
  reference: string;
  hasImages: boolean;
  imageCount: number;
  // Add other details needed for display if required
}

export async function getObituaryDetails(
  reference: unknown
): Promise<{ data?: ObituaryDetails; error?: string }> {
  try {
    const validatedReference = referenceSchema.parse(reference);

    const obituary = await prisma.obituary.findUnique({
      where: { reference: validatedReference },
      select: {
        reference: true,
        imageNames: true, // Check if this array has items
        _count: {
          // Use _count for efficiency if only count is needed
          select: { images: true, fileImages: true }
        }
        // Alternatively, select the relations if you need filenames etc.
        // images: { select: { name: true }, take: 1 }, // Select first Image
        // fileImages: { select: { name: true }, take: 1 }, // Select first ImageFile
      }
    });

    if (!obituary) {
      return { error: "Obituary not found." };
    }

    // Determine if images exist based on relations or imageNames array
    const imageCount =
      (obituary._count?.images ?? 0) + (obituary._count?.fileImages ?? 0);
    const hasImagesBasedOnCount = imageCount > 0;
    // Or check the string array if that's the primary indicator:
    const hasImagesBasedOnArray =
      obituary.imageNames && obituary.imageNames.length > 0;

    const hasImages = hasImagesBasedOnCount || hasImagesBasedOnArray; // Combine checks if needed

    const details: ObituaryDetails = {
      reference: obituary.reference,
      hasImages: hasImages,
      imageCount: imageCount // You might want to use the more accurate count
    };

    return { data: details };
  } catch (error) {
    console.error("Error fetching obituary details:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid input." };
    }
    return { error: "Failed to retrieve obituary details." };
  }
}
