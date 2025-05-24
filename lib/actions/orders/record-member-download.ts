"use server";

import { prisma } from "@/lib/prisma";

interface MemberDownloadData {
  obituaryRef: string;
  obituaryName: string;
  customerEmail?: string;
  customerFullName?: string;
}

export async function recordMemberDownload({
  obituaryRef,
  obituaryName,
  customerEmail,
  customerFullName
}: MemberDownloadData) {
  try {
    // Create a new order record for the member download
    const order = await prisma.order.create({
      data: {
        totalAmount: 0, // Free for members
        currency: "cad",
        customerEmail: customerEmail || "", // Use email if available
        customerFullName: customerFullName || "", // Use name if available
        status: "COMPLETED", // Mark as completed immediately
        isMember: true, // This is a member download
        items: {
          create: [
            {
              obituaryRef,
              obituaryName,
              price: 0 // Free for members
            }
          ]
        }
      }
    });

    return {
      success: true,
      orderId: order.id
    };
  } catch (error) {
    console.error("Failed to record member download:", error);
    return {
      success: false,
      error: "Failed to record download"
    };
  }
}
