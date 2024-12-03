// const { PrismaClient } = require('@prisma/client');

// const prisma_ = new PrismaClient();

// // Define province/state codes
// const CANADIAN_PROVINCES: { [key: string]: string } = {
//   'AB': 'Alberta',
//   'BC': 'British Columbia',
//   'MB': 'Manitoba',
//   'NB': 'New Brunswick',
//   'NL': 'Newfoundland and Labrador',
//   'NS': 'Nova Scotia',
//   'NT': 'Northwest Territories',
//   'NU': 'Nunavut',
//   'ON': 'Ontario',
//   'PE': 'Prince Edward Island',
//   'QC': 'Quebec',
//   'SK': 'Saskatchewan',
//   'YT': 'Yukon'
// };

// const US_STATES: { [key: string]: string } = {
//   'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
//   'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
//   'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
//   'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
//   'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
//   'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
//   'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
//   'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
//   'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
//   'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
//   'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
//   'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
//   'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
// };

// async function updateCitiesCountry() {
//   try {
//     // Get country IDs for Canada and USA
//     const [canada, usa] = await Promise.all([
//       prisma_.country.findFirst({ where: { name: 'Canada' } }),
//       prisma_.country.findFirst({ where: { name: 'U.S.A.' } })
//     ]);

//     if (!canada || !usa) {
//       throw new Error('Could not find Canada or USA in the countries table');
//     }

//     // Get all cities with province codes
//     const cities = await prisma_.city.findMany({
//       where: {
//         province: {
//           not: null
//         }
//       },
//       select: {
//         id: true,
//         name: true,
//         province: true,
//         countryId: true
//       }
//     });

//     console.log(`Found ${cities.length} cities with province codes`);

//     let updatedCount = 0;
//     let skippedCount = 0;

//     for (const city of cities) {
//       const provinceCode = city.province?.trim().toUpperCase() as string;
      
//       if (!provinceCode) continue;

//       let newCountryId: string | null = null;

//       if (CANADIAN_PROVINCES[provinceCode]) {
//         newCountryId = canada.id;
//       } else if (US_STATES[provinceCode]) {
//         newCountryId = usa.id;
//       }

//       if (newCountryId && newCountryId !== city.countryId) {
//         await prisma_.city.update({
//           where: { id: city.id },
//           data: { countryId: newCountryId }
//         });
//         updatedCount++;
//         console.log(`Updated ${city.name}, ${provinceCode} to country ID: ${newCountryId}`);
//       } else {
//         skippedCount++;
//       }
//     }

//     console.log(`\nUpdate complete:`);
//     console.log(`- Updated ${updatedCount} cities`);
//     console.log(`- Skipped ${skippedCount} cities`);

//   } catch (error) {
//     console.error('Error updating cities:', error);
//   } finally {
//     await prisma_.$disconnect();
//   }
// }

// updateCitiesCountry()
//   .then(() => console.log('Script execution completed.'))
//   .catch((error) => console.error('Script execution failed:', error)); 