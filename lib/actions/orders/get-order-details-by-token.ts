"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

// Basic validation for a non-empty string token (UUID format check could be added if needed)
const inputSchema = z.string().min(1);

interface OrderDetails {
  orderId?: string;
  obituaryRefs?: string[];
  error?: string;
}

export async function getOrderDetailsByToken(
  token: unknown
): Promise<OrderDetails> {
  // 1. Validate Input
  const validation = inputSchema.safeParse(token);
  if (!validation.success) {
    console.error("Invalid token format:", validation.error);
    return { error: "Invalid token." };
  }
  const validToken = validation.data;

  try {
    // 2. Find the order by successToken, including its items
    const order = await prisma.order.findUnique({
      where: {
        successToken: validToken
        // Optionally, ensure the order status is completed or pending?
        // status: { in: [OrderStatus.COMPLETED, OrderStatus.PENDING] }
      },
      select: {
        id: true,
        items: {
          select: {
            obituaryRef: true
          }
        }
      }
    });

    if (!order) {
      return { error: "Order not found or token expired." };
    }

    // 3. Extract necessary details
    const orderId = order.id;
    const obituaryRefs = order.items.map(item => item.obituaryRef);

    if (obituaryRefs.length === 0) {
      // This case might indicate an issue if an order should always have items
      console.warn(`Order ${orderId} found with token, but has no items.`);
      return { error: "Order found but contains no items." };
    }

    return { orderId, obituaryRefs };
  } catch (error) {
    console.error("Error retrieving order by token:", error);
    return {
      error:
        `Failed to retrieve order details. ${error instanceof Error ? error.message : ""}`.trim()
    };
  }
}
