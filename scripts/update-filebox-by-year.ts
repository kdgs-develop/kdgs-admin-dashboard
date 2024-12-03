// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// async function updateFileBoxByYear() {
//   try {
//     // First, let's check what we're about to update
//     const non2023Obituaries = await prisma_.obituary.findMany({
//       where: {
//         NOT: {
//           AND: {
//             enteredOn: {
//               gte: new Date('2023-01-01T00:00:00Z'),
//               lt: new Date('2024-01-01T00:00:00Z'),
//             }
//           }
//         },
//       },
//       select: {
//         id: true,
//         enteredOn: true,
//       }
//     });

//     const year2023Obituaries = await prisma_.obituary.findMany({
//       where: {
//         AND: {
//           enteredOn: {
//             gte: new Date('2023-01-01T00:00:00Z'),
//             lt: new Date('2024-01-01T00:00:00Z'),
//           }
//         },
//       },
//       select: {
//         id: true,
//         enteredOn: true,
//       }
//     });

//     console.log(`Found ${non2023Obituaries.length} non-2023 obituaries to set to fileBoxId: 0`);
//     console.log(`Found ${year2023Obituaries.length} 2023 obituaries to set to fileBoxId: 1`);
    
//     console.log('\nSample non-2023 dates:', non2023Obituaries.slice(0, 3).map((o: { enteredOn: Date }) => o.enteredOn));
//     console.log('Sample 2023 dates:', year2023Obituaries.slice(0, 3).map((o: { enteredOn: Date }) => o.enteredOn));

//     // Confirm before proceeding
//     const userInput = await new Promise(resolve => {
//       const readline = require('readline').createInterface({
//         input: process.stdin,
//         output: process.stdout
//       });
      
//       readline.question('Proceed with update? (yes/no): ', (answer: string) => {
//         readline.close();
//         resolve(answer.toLowerCase());
//       });
//     });

//     if (userInput !== 'yes') {
//       console.log('Update cancelled');
//       return;
//     }

//     // Update non-2023 obituaries
//     const resultNon2023 = await prisma_.obituary.updateMany({
//       where: {
//         NOT: {
//           AND: {
//             enteredOn: {
//               gte: new Date('2023-01-01T00:00:00Z'),
//               lt: new Date('2024-01-01T00:00:00Z'),
//             }
//           }
//         },
//       },
//       data: {
//         fileBoxId: 0,
//       },
//     });

//     // Update 2023 obituaries
//     const result2023 = await prisma_.obituary.updateMany({
//       where: {
//         AND: {
//           enteredOn: {
//             gte: new Date('2023-01-01T00:00:00Z'),
//             lt: new Date('2024-01-01T00:00:00Z'),
//           }
//         },
//       },
//       data: {
//         fileBoxId: 1,
//       },
//     });

//     console.log(`Reset fileBoxId to 0 for ${resultNon2023.count} non-2023 obituaries.`);
//     console.log(`Set fileBoxId to 1 for ${result2023.count} 2023 obituaries.`);
//   } catch (error) {
//     console.error('Error updating obituary fileBoxIds:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// updateFileBoxByYear();