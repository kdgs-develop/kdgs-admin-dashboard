// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// async function updateObituariesProofreadStatus() {
//   console.log('Starting obituary proofread status update...');

//   try {
//     const obituaries = await prisma_.obituary.findMany({
//       where: { proofread: true },
//       select: { id: true, reference: true }
//     });

//     console.log(`Found ${obituaries.length} obituaries marked as proofread.`);

//     let updatedCount = 0;

//     for (const obituary of obituaries) {
//       // Check if there are any images with a name that starts with the obituary reference
//       const imageCount = await prisma_.imageFile.count({
//         where: {
//           name: {
//             startsWith: obituary.reference
//           }
//         }
//       });

//       if (imageCount === 0) {
//         await prisma_.obituary.update({
//           where: { id: obituary.id },
//           data: {
//             proofread: false,
//             proofreadDate: null,
//             proofreadBy: null
//           }
//         });
//         updatedCount++;
//         console.log(`Updated obituary ${obituary.reference}: proofread set to false`);
//       }
//     }

//     console.log(`Update complete. ${updatedCount} obituaries were updated.`);
//   } catch (error) {
//     console.error('An error occurred during the update process:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// updateObituariesProofreadStatus()
//   .then(() => console.log('Script execution completed.'))
//   .catch((error) => console.error('Script execution failed:', error));
