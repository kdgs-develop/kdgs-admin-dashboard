// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// async function resetFileBoxForNon2023Obituaries() {
//   try {
//     const startDate = new Date('2023-01-01T00:00:00Z');
//     const endDate = new Date('2023-12-31T23:59:59Z');

//     const result = await prisma_.obituary.updateMany({
//       where: {
//         NOT: {
//           enteredOn: {
//             gte: startDate,
//             lte: endDate,
//           },
//         },
//       },
//       data: {
//         fileBoxId: 0,
//       },
//     });

//     console.log(`Reset fileBoxId to 0 for ${result.count} non-2023 obituaries.`);
//   } catch (error) {
//     console.error('Error resetting obituary fileBoxIds:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// resetFileBoxForNon2023Obituaries();