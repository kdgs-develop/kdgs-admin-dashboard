"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  orderId: z.string().cuid(),
  email: z.string().email().optional().nullable(),
  fullName: z.string().min(1).optional().nullable(),
  country: z.string().length(2).optional().nullable() // Assuming 2-letter country code
});

interface UpdateResult {
  success: boolean;
  error?: string;
}

export async function updateOrderCustomerDetails(
  input: unknown
): Promise<UpdateResult> {
  // 1. Validate Input
  const validation = inputSchema.safeParse(input);
  if (!validation.success) {
    console.error(
      "Invalid input for updating order details:",
      validation.error
    );
    return { success: false, error: "Invalid input data." };
  }
  const { orderId, email, fullName, country } = validation.data;

  try {
    // 2. Update the order if details are provided
    await prisma.order.update({
      where: { id: orderId },
      data: {
        // Only update fields if they have a value
        ...(email && { customerEmail: email }),
        ...(fullName && { customerFullName: fullName }),
        ...(country && { customerCountry: country })
      }
    });

    return { success: true };
  } catch (error) {
    console.error(
      `Error updating customer details for order ${orderId}:`,
      error
    );
    return {
      success: false,
      error:
        `Failed to update order information. ${error instanceof Error ? error.message : ""}`.trim()
    };
  }
}
