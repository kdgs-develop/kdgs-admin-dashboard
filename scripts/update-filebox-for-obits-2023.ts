const { PrismaClient } = require('@prisma/client');

const prisma_ = new PrismaClient();

async function updateFileBoxForObituary2023() {
  try {
    const startDate = new Date('2023-01-01T00:00:00Z');
    const endDate = new Date('2023-12-31T23:59:59Z');

    const result = await prisma_.obituary.updateMany({
      where: {
        enteredOn: {
          gte: startDate,
          lte: endDate,
        },
      },
      data: {
        fileBoxId: 1,
      },
    });

    console.log(`Updated ${result.count} obituaries.`);
  } catch (error) {
    console.error('Error updating obituaries:', error);
  } finally {
    await prisma_.$disconnect();
  }
}

updateFileBoxForObituary2023();