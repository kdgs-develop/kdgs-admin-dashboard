// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient()

// async function migrateBatchData() {
//   try {
//     // Get all unique batch numbers from obituaries
//     const obituaries = await prisma_.obituary.findMany({
//       where: {
//         batch: {
//           not: null
//         }
//       },
//       select: {
//         batch: true
//       },
//       distinct: ['batch']
//     })

//     console.log(`Found ${obituaries.length} unique batch numbers to migrate`)

//     // Get an admin user to associate with historical batches
//     const adminUser = await prisma_.genealogist.findFirst({
//       where: {
//         role: 'ADMIN'
//       }
//     })

//     if (!adminUser) {
//       throw new Error('No admin user found to associate with historical batches')
//     }

//     // Create new batch records and update obituaries
//     for (const { batch } of obituaries) {
//       if (!batch) continue

//       // Create new batch record
//       const newBatch = await prisma_.batchNumber.create({
//         data: {
//           number: batch,
//           createdById: adminUser.clerkId
//         }
//       })

//       // Update all obituaries with this batch number
//       await prisma_.obituary.updateMany({
//         where: {
//           batch: batch
//         },
//         data: {
//           batchNumberId: newBatch.id
//         }
//       })

//       console.log(`Migrated batch: ${batch}`)
//     }

//     console.log('Migration completed successfully')

//   } catch (error) {
//     console.error('Migration failed:', error)
//     throw error
//   } finally {
//     await prisma_.$disconnect()
//   }
// }

// migrateBatchData() 