// const { PrismaClient } = require('@prisma/client');
// const { parse } = require('csv-parse');
// const fs = require('fs');

// const prisma = new PrismaClient();

// async function populateImageFileTable() {
//   const parser = fs
//     .createReadStream('filenames.csv')
//     .pipe(parse({ delimiter: ',', columns: true, trim: true }));

//   for await (const record of parser) {
//     const { FileName, Extension, 'Size (KB)': sizeKB, 'Created Date': createdAtString, 'Last Edit Date': editedAtString } = record;

//     const name = FileName.replace(/^"|"$/g, '');
//     const extension = Extension.replace(/^"|"$/g, '').slice(1); // Remove leading dot and quotes
//     const size = Math.round(parseFloat(sizeKB) * 1024); // Convert KB to bytes
//     const createdAt = new Date(createdAtString);
//     const editedAt = new Date(editedAtString);

//     try {
//       await prisma.imageFile.create({
//         data: {
//           name,
//           extension,
//           size,
//           createdAt,
//           editedAt
//         }
//       });
//       console.log(`Inserted: ${name}`);
//     } catch (error) {
//       console.error(`Error inserting ${name}: ${error}`);
//     }
//   }

//   console.log('ImageFile table populated successfully');
// }

// populateImageFileTable()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });