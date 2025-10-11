import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  try {
    const [
      fileBoxCount,
      batchNumberCount,
      countryCount,
      locationCount,
      periodicalCount,
      relationshipCount,
      cemeteryCount,
      titleCount,
      genealogistCount,
      orderCount
    ] = await Promise.all([
      prisma.fileBox.count().catch(() => 0),
      prisma.batchNumber.count().catch(() => 0),
      prisma.country.count().catch(() => 0),
      prisma.location.count().catch(() => 0),
      prisma.periodical.count().catch(() => 0),
      prisma.relationship.count().catch(() => 0),
      prisma.cemetery.count().catch(() => 0),
      prisma.title.count().catch(() => 0),
      prisma.genealogist.count().catch(() => 0),
      prisma.order.count().catch(() => 0)
    ]);

    return {
      fileBoxes: { count: fileBoxCount || 0 },
      batchNumbers: { count: batchNumberCount || 0 },
      countries: { count: countryCount || 0 },
      locations: { count: locationCount || 0 },
      periodicals: { count: periodicalCount || 0 },
      relationships: { count: relationshipCount || 0 },
      cemeteries: { count: cemeteryCount || 0 },
      titles: { count: titleCount || 0 },
      genealogists: { count: genealogistCount || 0 },
      orders: { count: orderCount || 0 }
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      fileBoxes: { count: 0 },
      batchNumbers: { count: 0 },
      countries: { count: 0 },
      locations: { count: 0 },
      periodicals: { count: 0 },
      relationships: { count: 0 },
      cemeteries: { count: 0 },
      titles: { count: 0 },
      genealogists: { count: 0 },
      orders: { count: 0 }
    };
  }
}
