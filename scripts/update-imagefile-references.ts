// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// async function updateImageFileReferences() {
//   try {
//     const imageFiles = await prisma_.imageFile.findMany({
//       select: {
//         id: true,
//         name: true,
//       },
//     });

//     console.log(`Found ${imageFiles.length} image files to process.`);
    
//     let updatedCount = 0;
//     let skippedCount = 0;

//     for (const imageFile of imageFiles) {
//       const reference = imageFile.name.slice(0, 8);

//       // Check if obituary with this reference exists
//       const obituaryExists = await prisma_.obituary.findUnique({
//         where: { reference },
//         select: { reference: true }
//       });

//       if (obituaryExists) {
//         await prisma_.imageFile.update({
//           where: { id: imageFile.id },
//           data: { reference },
//         });
//         updatedCount++;
//         console.log(`Updated image file ${imageFile.name} with reference: ${reference}`);
//       } else {
//         skippedCount++;
//         console.log(`Skipped ${imageFile.name}: No obituary found with reference ${reference}`);
//       }
//     }

//     console.log('\nUpdate summary:');
//     console.log(`- Updated: ${updatedCount} files`);
//     console.log(`- Skipped: ${skippedCount} files`);
//     console.log('Process completed successfully.');
//   } catch (error) {
//     console.error('Error updating image file references:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// updateImageFileReferences()
//   .then(() => console.log('Script execution completed.'))
//   .catch((error) => console.error('Script execution failed:', error));