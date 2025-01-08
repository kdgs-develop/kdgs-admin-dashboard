// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// const familyRelationships = [
//   { name: 'Father', category: 'Immediate Family' },
//   { name: 'Mother', category: 'Immediate Family' },
//   { name: 'Parent', category: 'Immediate Family' },
//   { name: 'Son', category: 'Immediate Family' },
//   { name: 'Daughter', category: 'Immediate Family' },
//   { name: 'Child', category: 'Immediate Family' },
//   { name: 'Brother', category: 'Immediate Family' },
//   { name: 'Sister', category: 'Immediate Family' },
//   { name: 'Sibling', category: 'Immediate Family' },
//   // Extended Family
//   { name: 'Grandfather', category: 'Extended Family' },
//   { name: 'Grandmother', category: 'Extended Family' },
//   { name: 'Grandparent', category: 'Extended Family' },
//   { name: 'Grandson', category: 'Extended Family' },
//   { name: 'Granddaughter', category: 'Extended Family' },
//   { name: 'Grandchild', category: 'Extended Family' },
//   { name: 'Great Grandson', category: 'Extended Family' },
//   { name: 'Great Granddaughter', category: 'Extended Family' },
//   { name: 'Great Grandchild', category: 'Extended Family' },
//   { name: 'G-G-Great Grandson', category: 'Extended Family' },
//   { name: 'G-G-Great Granddaughter', category: 'Extended Family' },
//   { name: 'G-G-Great Grandchild', category: 'Extended Family' },
//   { name: 'G-G-G-Great Grandson', category: 'Extended Family' },
//   { name: 'G-G-G-Great Granddaughter', category: 'Extended Family' },
//   { name: 'G-G-G-Great Grandchild', category: 'Extended Family' },
//   { name: 'Aunt', category: 'Extended Family' },
//   { name: 'Uncle', category: 'Extended Family' },
//   { name: "Parent's Sibling", category: 'Extended Family' },
//   { name: 'Niece', category: 'Extended Family' },
//   { name: 'Nephew', category: 'Extended Family' },
//   { name: "Sibling's Child", category: 'Extended Family' },
//   { name: 'Male Cousin', category: 'Extended Family' },
//   { name: 'Female Cousin', category: 'Extended Family' },
//   { name: 'Cousin', category: 'Extended Family' },
//   // In-Laws
//   { name: 'Father-in-law', category: 'In-Laws' },
//   { name: 'Mother-in-law', category: 'In-Laws' },
//   { name: 'Parent-in-law', category: 'In-Laws' },
//   { name: 'Son-in-law', category: 'In-Laws' },
//   { name: 'Daughter-in-law', category: 'In-Laws' },
//   { name: 'Child-in-law', category: 'In-Laws' },
//   { name: 'Brother-in-law', category: 'In-Laws' },
//   { name: 'Sister-in-law', category: 'In-Laws' },
//   { name: 'Sibling-in-law', category: 'In-Laws' },
//   // Step-Family
//   { name: 'Stepfather', category: 'Step-Family' },
//   { name: 'Stepmother', category: 'Step-Family' },
//   { name: 'Stepparent', category: 'Step-Family' },
//   { name: 'Stepson', category: 'Step-Family' },
//   { name: 'Stepdaughter', category: 'Step-Family' },
//   { name: 'Stepchild', category: 'Step-Family' },
//   { name: 'Stepbrother', category: 'Step-Family' },
//   { name: 'Stepsister', category: 'Step-Family' },
//   { name: 'Stepsibling', category: 'Step-Family' },
//   // Foster/Adoptive Family
//   { name: 'Foster Father', category: 'Foster/Adoptive Family' },
//   { name: 'Foster Mother', category: 'Foster/Adoptive Family' },
//   { name: 'Foster Parent', category: 'Foster/Adoptive Family' },
//   { name: 'Foster Son', category: 'Foster/Adoptive Family' },
//   { name: 'Foster Daughter', category: 'Foster/Adoptive Family' },
//   { name: 'Foster Child', category: 'Foster/Adoptive Family' },
//   { name: 'Adoptive Father', category: 'Foster/Adoptive Family' },
//   { name: 'Adoptive Mother', category: 'Foster/Adoptive Family' },
//   { name: 'Adoptive Parent', category: 'Foster/Adoptive Family' },
//   { name: 'Adoptive Son', category: 'Foster/Adoptive Family' },
//   { name: 'Adoptive Daughter', category: 'Foster/Adoptive Family' },
//   { name: 'Adoptive Child', category: 'Foster/Adoptive Family' },
//   // Others
//   { name: 'Godfather', category: 'Others' },
//   { name: 'Godmother', category: 'Others' },
//   { name: 'Godparent', category: 'Others' },
//   { name: 'Godson', category: 'Others' },
//   { name: 'Goddaughter', category: 'Others' },
//   { name: 'Godchild', category: 'Others' },
//   { name: 'Half-Brother', category: 'Others' },
//   { name: 'Half-Sister', category: 'Others' },
//   { name: 'Half-Sibling', category: 'Others' },
//   { name: 'Spouse', category: 'Others' },
//   { name: 'Fiancé(e)', category: 'Others' },
//   // Optional Extensions
//   { name: 'Co-brother-in-law', category: 'Optional Extensions' },
//   { name: 'Co-sister-in-law', category: 'Optional Extensions' },
//   { name: 'Co-sibling-in-law', category: 'Optional Extensions' },
//   { name: 'Great-grandfather', category: 'Optional Extensions' },
//   { name: 'Great-grandmother', category: 'Optional Extensions' },
//   { name: 'Great-grandparent', category: 'Optional Extensions' },
//   { name: 'Great-great-grandfather', category: 'Optional Extensions' },
//   { name: 'Great-great-grandmother', category: 'Optional Extensions' },
//   { name: 'Great-great-grandparent', category: 'Optional Extensions' },
//   { name: 'G-G-Great Grandfather', category: 'Optional Extensions' },
//   { name: 'G-G-Great Grandmother', category: 'Optional Extensions' },
//   { name: 'G-G-Great Grandparent', category: 'Optional Extensions' },
//   { name: 'G-G-G-Great Grandfather', category: 'Optional Extensions' },
//   { name: 'G-G-G-Great Grandmother', category: 'Optional Extensions' },
//   { name: 'G-G-G-Great Grandparent', category: 'Optional Extensions' }
// ];

// async function populateFamilyRelationships() {
//   try {
//     console.log('Starting to populate family relationships...');

//     for (const relationship of familyRelationships) {
//       await prisma_.familyRelationship.create({
//         data: relationship
//       });
//       console.log(`Created relationship: ${relationship.name}`);
//     }

//     console.log('Family relationships populated successfully');
//   } catch (error) {
//     console.error('Error populating family relationships:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// populateFamilyRelationships()
//   .then(() => console.log('Script execution completed'))
//   .catch((error) => console.error('Script execution failed:', error));
