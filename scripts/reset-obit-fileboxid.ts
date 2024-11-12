// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// async function resetFileBoxForAllObituaries() {
//   try {
//     const result = await prisma_.obituary.updateMany({
//       where: {},
//       data: {
//         fileBoxId: 0,
//       },
//     });

//     console.log(`Reset fileBoxId to 0 for ${result.count} obituaries.`);
//   } catch (error) {
//     console.error('Error resetting obituary fileBoxIds:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// resetFileBoxForAllObituaries();