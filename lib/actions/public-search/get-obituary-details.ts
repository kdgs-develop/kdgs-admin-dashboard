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
      // Select only the fields needed now
      select: {
        reference: true,
        imageNames: true
        // No longer need _count for this logic
        // _count: {
        //   select: { images: true, fileImages: true }
        // }
      }
    });

    if (!obituary) {
      return { error: "Obituary not found." };
    }

    // Calculate count and hasImages based *only* on imageNames array
    const imageCount = obituary.imageNames?.length ?? 0;
    const hasImages = imageCount > 0;

    // Removed the check based on _count
    // const hasImagesBasedOnCount = imageCount > 0;
    // const hasImagesBasedOnArray =
    //   obituary.imageNames && obituary.imageNames.length > 0;
    // const hasImages = hasImagesBasedOnCount || hasImagesBasedOnArray;

    const details: ObituaryDetails = {
      reference: obituary.reference,
      hasImages: hasImages,
      imageCount: imageCount
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
