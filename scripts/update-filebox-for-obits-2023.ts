// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// async function updateFileBoxForObituary2023() {
//   try {
//     const result = await prisma_.obituary.updateMany({
//       where: {
//         enteredOn: {
//           gte: new Date(Date.UTC(2023, 0, 1)), // January 1, 2023
//           lt: new Date(Date.UTC(2024, 0, 1)) // January 1, 2024
//         }
//       },
//       data: {
//         fileBoxId: 1
//       }
//     });

//     console.log(`Updated ${result.count} obituaries.`);
//   } catch (error) {
//     console.error('Error updating obituaries:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// updateFileBoxForObituary2023();
