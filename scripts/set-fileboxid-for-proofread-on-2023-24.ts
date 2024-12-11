// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// async function setFileBoxForProofread2023And2024Obituaries() {
//   try {
//     const result = await prisma_.obituary.updateMany({
//       where: {
//         proofreadDate: {
//           gte: new Date(Date.UTC(2023, 0, 1)), // January 1, 2023
//           lt: new Date(Date.UTC(2025, 0, 1))   // January 1, 2025
//         },
//       },
//       data: {
//         fileBoxId: 1,
//       },
//     });

//     console.log(`Set fileBoxId to 1 for ${result.count} obituaries proofread in 2023 and 2024.`);
//   } catch (error) {
//     console.error('Error setting obituary fileBoxIds:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// setFileBoxForProofread2023And2024Obituaries();