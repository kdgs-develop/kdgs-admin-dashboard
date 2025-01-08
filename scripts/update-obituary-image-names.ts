// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// async function updateObituaryImageNames() {
//   try {
//     const obituaries = await prisma_.obituary.findMany({
//       include: {
//         images: {
//           select: { name: true }
//         }
//       }
//     });
//     let count = 1;
//     const total = obituaries.length;
//     console.log(`Processing ${obituaries.length} obituaries...`);
//     for (const obituary of obituaries) {
//       const imageNames = obituary.images.map((img: { name: string }) => img.name);
      
//       await prisma_.obituary.update({
//         where: { id: obituary.id },
//         data: {
//           imageNames: imageNames,
//         }
//       });
//       console.log(`Updated obituary ${obituary.id} with ${imageNames.length} images. ${count} of ${total} processed`);
//       count++;
//     }

//     console.log('Update completed successfully');
//   } catch (error) {
//     console.error('Error updating obituary image names:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// updateObituaryImageNames(); 