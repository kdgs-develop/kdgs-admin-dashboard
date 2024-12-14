// import { PrismaClient } from '@prisma/client';
const { PrismaClient } = require('@prisma/client');


const prisma_ = new PrismaClient();

async function updateImageReferences() {
  try {
    const images = await prisma_.image.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`Found ${images.length} images to process.`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const image of images) {
      const reference = image.name.slice(0, 8); // Get the first 8 characters of the name

      // Check if an obituary with this reference exists
      const obituaryExists = await prisma_.obituary.findUnique({
        where: { reference },
        select: { reference: true },
      });

      if (obituaryExists) {
        await prisma_.image.update({
          where: { id: image.id },
          data: { reference },
        });
        updatedCount++;
        console.log(`Updated image ${image.name} with reference: ${reference}`);
      } else {
        skippedCount++;
        console.log(`Skipped ${image.name}: No obituary found with reference ${reference}`);
      }
    }

    console.log('\nUpdate summary:');
    console.log(`- Updated: ${updatedCount} images`);
    console.log(`- Skipped: ${skippedCount} images`);
    console.log('Process completed successfully.');
  } catch (error) {
    console.error('Error updating image references:', error);
  } finally {
    await prisma_.$disconnect();
  }
}

updateImageReferences()
  .then(() => console.log('Script execution completed.'))
  .catch((error) => console.error('Script execution failed:', error)); 