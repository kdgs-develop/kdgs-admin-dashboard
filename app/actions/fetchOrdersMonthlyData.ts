"use server";

import { prisma } from "@/lib/prisma";

export async function fetchOrdersMonthlyData(
  year: number = new Date().getFullYear()
) {
  try {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];

    // Initialize arrays to store data
    const salesTotal: number[] = new Array(12).fill(0);
    const salesMember: number[] = new Array(12).fill(0);
    const salesNonMember: number[] = new Array(12).fill(0);

    const countTotal: number[] = new Array(12).fill(0);
    const countMember: number[] = new Array(12).fill(0);
    const countNonMember: number[] = new Array(12).fill(0);

    // Get previous year data as well
    const prevYear = year - 1;
    const prevSalesTotal: number[] = new Array(12).fill(0);
    const prevSalesMember: number[] = new Array(12).fill(0);
    const prevSalesNonMember: number[] = new Array(12).fill(0);

    const prevCountTotal: number[] = new Array(12).fill(0);
    const prevCountMember: number[] = new Array(12).fill(0);
    const prevCountNonMember: number[] = new Array(12).fill(0);

    // Get orders for current year
    const currentYearOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01T00:00:00.000Z`),
          lt: new Date(`${year + 1}-01-01T00:00:00.000Z`)
        }
      },
      include: {
        items: true
      }
    });

    // Get orders for previous year
    const prevYearOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(`${prevYear}-01-01T00:00:00.000Z`),
          lt: new Date(`${prevYear + 1}-01-01T00:00:00.000Z`)
        }
      },
      include: {
        items: true
      }
    });

    // Process current year data
    for (const order of currentYearOrders) {
      const month = new Date(order.createdAt).getMonth();
      const orderTotal = order.totalAmount || 0;

      // Increment sales data
      salesTotal[month] += orderTotal;

      if (order.isMember) {
        salesMember[month] += orderTotal;
      } else {
        salesNonMember[month] += orderTotal;
      }

      // Increment count data
      countTotal[month] += 1;

      if (order.isMember) {
        countMember[month] += 1;
      } else {
        countNonMember[month] += 1;
      }
    }

    // Process previous year data
    for (const order of prevYearOrders) {
      const month = new Date(order.createdAt).getMonth();
      const orderTotal = order.totalAmount || 0;

      // Increment sales data
      prevSalesTotal[month] += orderTotal;

      if (order.isMember) {
        prevSalesMember[month] += orderTotal;
      } else {
        prevSalesNonMember[month] += orderTotal;
      }

      // Increment count data
      prevCountTotal[month] += 1;

      if (order.isMember) {
        prevCountMember[month] += 1;
      } else {
        prevCountNonMember[month] += 1;
      }
    }

    // Format the data for return
    return {
      labels: monthNames,
      salesData: {
        total: salesTotal,
        member: salesMember,
        nonMember: salesNonMember,
        prevYearTotal: prevSalesTotal,
        prevYearMember: prevSalesMember,
        prevYearNonMember: prevSalesNonMember
      },
      countData: {
        total: countTotal,
        member: countMember,
        nonMember: countNonMember,
        prevYearTotal: prevCountTotal,
        prevYearMember: prevCountMember,
        prevYearNonMember: prevCountNonMember
      },
      year,
      previousYear: prevYear
    };
  } catch (error) {
    console.error("Error fetching orders monthly data:", error);
    throw new Error("Failed to fetch orders monthly data");
  }
}
