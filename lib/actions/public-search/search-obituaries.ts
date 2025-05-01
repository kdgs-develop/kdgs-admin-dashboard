"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Obituary } from "@prisma/client";

const relativeSchema = z.object({
  surname: z.string().optional(),
  givenNames: z.string().optional()
});

// Define a schema for the expected input, including pagination
const searchInputSchema = z.object({
  surname: z.string().optional(),
  givenNames: z.string().optional(),
  maidenName: z.string().optional(),
  alsoKnownAs: z.string().optional(),
  relatives: z.array(relativeSchema).optional(),
  birthDay: z.string().optional(),
  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
  birthYearFrom: z.string().optional(),
  birthYearTo: z.string().optional(),
  birthPlace: z.string().optional(),
  deathDay: z.string().optional(),
  deathMonth: z.string().optional(),
  deathYear: z.string().optional(),
  deathYearFrom: z.string().optional(),
  deathYearTo: z.string().optional(),
  deathPlace: z.string().optional(),
  birthDateType: z.enum(["exact", "range"]).optional(),
  deathDateType: z.enum(["exact", "range"]).optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(10)
});

// Define the structure of the returned search results
export interface SearchResult {
  reference: string;
  givenNames: string | null;
  surname: string | null;
  maidenName: string | null;
  birthDate: Date | null;
  deathDate: Date | null;
}

// Define the structure of the successful response
export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}

export async function searchObituaries(
  input: unknown
): Promise<{ data?: SearchResponse; error?: string }> {
  try {
    // Validate the input against the schema
    const validatedInput = searchInputSchema.parse(input);
    const { page, pageSize, ...searchCriteria } = validatedInput;

    const where: any = {}; // Build the where clause based on searchCriteria
    const conditions: any[] = []; // Use an array for AND conditions

    // Name conditions
    if (searchCriteria.surname) {
      conditions.push({
        surname: { contains: searchCriteria.surname, mode: "insensitive" }
      });
    }
    if (searchCriteria.givenNames) {
      conditions.push({
        givenNames: { contains: searchCriteria.givenNames, mode: "insensitive" }
      });
    }
    // Add Maiden Name search condition
    if (searchCriteria.maidenName) {
      conditions.push({
        maidenName: { contains: searchCriteria.maidenName, mode: "insensitive" }
      });
    }

    // Also Known As
    if (searchCriteria.alsoKnownAs) {
      // Add AKA condition to the main list
      conditions.push({
        alsoKnownAs: {
          some: {
            OR: [
              {
                surname: {
                  contains: searchCriteria.alsoKnownAs,
                  mode: "insensitive"
                }
              },
              {
                otherNames: {
                  contains: searchCriteria.alsoKnownAs,
                  mode: "insensitive"
                }
              }
            ]
          }
        }
      });
    }

    // Relatives
    if (searchCriteria.relatives && searchCriteria.relatives.length > 0) {
      const relativeConditions = searchCriteria.relatives
        .map(rel => {
          const relConditions = [];

          if (rel.surname) {
            relConditions.push({
              surname: { contains: rel.surname, mode: "insensitive" }
            });
          }

          if (rel.givenNames) {
            relConditions.push({
              givenNames: { contains: rel.givenNames, mode: "insensitive" }
            });
          }

          // Only create a condition if at least one field is specified
          if (relConditions.length > 0) {
            return {
              AND: relConditions
            };
          }

          return null;
        })
        .filter(Boolean);

      if (relativeConditions.length > 0) {
        conditions.push({
          relatives: {
            some: {
              OR: relativeConditions
            }
          }
        });
      }
    }

    // Birth Date
    const birthDateType = searchCriteria.birthDateType ?? "exact";
    if (birthDateType === "exact") {
      const year = parseInt(searchCriteria.birthYear || "", 10);
      const month = parseInt(searchCriteria.birthMonth || "", 10);
      const day = parseInt(searchCriteria.birthDay || "", 10);

      if (!isNaN(year)) {
        if (!isNaN(month) && !isNaN(day)) {
          // Full date provided (year + month + day)
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const targetDate = new Date(Date.UTC(year, month - 1, day));
            if (!isNaN(targetDate.getTime())) {
              conditions.push({ birthDate: { equals: targetDate } });
            } else {
              console.warn(
                `Invalid exact birth date components: ${year}-${month}-${day}`
              );
              // Fallback to year-month search
              if (month >= 1 && month <= 12) {
                const startMonth = new Date(Date.UTC(year, month - 1, 1));
                const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
                const endMonth = new Date(
                  Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999)
                );
                conditions.push({
                  birthDate: { gte: startMonth, lte: endMonth }
                });
              } else {
                // Fallback to year search
                const startYear = new Date(Date.UTC(year, 0, 1));
                const endYear = new Date(
                  Date.UTC(year, 11, 31, 23, 59, 59, 999)
                );
                conditions.push({
                  birthDate: { gte: startYear, lte: endYear }
                });
              }
            }
          } else {
            // Invalid month/day values, fallback to year-month or year search
            if (month >= 1 && month <= 12) {
              const startMonth = new Date(Date.UTC(year, month - 1, 1));
              const lastDay = new Date(year, month, 0).getDate();
              const endMonth = new Date(
                Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999)
              );
              conditions.push({
                birthDate: { gte: startMonth, lte: endMonth }
              });
            } else {
              const startYear = new Date(Date.UTC(year, 0, 1));
              const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
              conditions.push({ birthDate: { gte: startYear, lte: endYear } });
            }
          }
        } else if (!isNaN(month)) {
          // Only year and month provided
          if (month >= 1 && month <= 12) {
            const startMonth = new Date(Date.UTC(year, month - 1, 1));
            const lastDay = new Date(year, month, 0).getDate();
            const endMonth = new Date(
              Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999)
            );
            conditions.push({ birthDate: { gte: startMonth, lte: endMonth } });
          } else {
            // Invalid month, fallback to year search
            const startYear = new Date(Date.UTC(year, 0, 1));
            const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
            conditions.push({ birthDate: { gte: startYear, lte: endYear } });
          }
        } else {
          // Only year provided
          const startYear = new Date(Date.UTC(year, 0, 1));
          const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
          conditions.push({ birthDate: { gte: startYear, lte: endYear } });
        }
      }
    } else if (birthDateType === "range") {
      // Range logic remains the same
      const yearFrom = parseInt(searchCriteria.birthYearFrom || "", 10);
      const yearTo = parseInt(searchCriteria.birthYearTo || "", 10);
      const rangeConditions: { gte?: Date; lte?: Date } = {};
      if (!isNaN(yearFrom)) {
        const date = new Date(Date.UTC(yearFrom, 0, 1));
        if (!isNaN(date.getTime())) rangeConditions.gte = date;
      }
      if (!isNaN(yearTo)) {
        const date = new Date(Date.UTC(yearTo, 11, 31, 23, 59, 59, 999));
        if (!isNaN(date.getTime())) rangeConditions.lte = date;
      }
      if (Object.keys(rangeConditions).length > 0) {
        conditions.push({ birthDate: rangeConditions });
      }
    }
    // Death Date
    const deathDateType = searchCriteria.deathDateType ?? "exact";
    if (deathDateType === "exact") {
      const year = parseInt(searchCriteria.deathYear || "", 10);
      const month = parseInt(searchCriteria.deathMonth || "", 10);
      const day = parseInt(searchCriteria.deathDay || "", 10);

      if (!isNaN(year)) {
        if (!isNaN(month) && !isNaN(day)) {
          // Full date provided (year + month + day)
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const targetDate = new Date(Date.UTC(year, month - 1, day));
            if (!isNaN(targetDate.getTime())) {
              conditions.push({ deathDate: { equals: targetDate } });
            } else {
              console.warn(
                `Invalid exact death date components: ${year}-${month}-${day}`
              );
              // Fallback to year-month search
              if (month >= 1 && month <= 12) {
                const startMonth = new Date(Date.UTC(year, month - 1, 1));
                const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
                const endMonth = new Date(
                  Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999)
                );
                conditions.push({
                  deathDate: { gte: startMonth, lte: endMonth }
                });
              } else {
                // Fallback to year search
                const startYear = new Date(Date.UTC(year, 0, 1));
                const endYear = new Date(
                  Date.UTC(year, 11, 31, 23, 59, 59, 999)
                );
                conditions.push({
                  deathDate: { gte: startYear, lte: endYear }
                });
              }
            }
          } else {
            // Invalid month/day values, fallback to year-month or year search
            if (month >= 1 && month <= 12) {
              const startMonth = new Date(Date.UTC(year, month - 1, 1));
              const lastDay = new Date(year, month, 0).getDate();
              const endMonth = new Date(
                Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999)
              );
              conditions.push({
                deathDate: { gte: startMonth, lte: endMonth }
              });
            } else {
              const startYear = new Date(Date.UTC(year, 0, 1));
              const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
              conditions.push({ deathDate: { gte: startYear, lte: endYear } });
            }
          }
        } else if (!isNaN(month)) {
          // Only year and month provided
          if (month >= 1 && month <= 12) {
            const startMonth = new Date(Date.UTC(year, month - 1, 1));
            const lastDay = new Date(year, month, 0).getDate();
            const endMonth = new Date(
              Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999)
            );
            conditions.push({ deathDate: { gte: startMonth, lte: endMonth } });
          } else {
            // Invalid month, fallback to year search
            const startYear = new Date(Date.UTC(year, 0, 1));
            const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
            conditions.push({ deathDate: { gte: startYear, lte: endYear } });
          }
        } else {
          // Only year provided
          const startYear = new Date(Date.UTC(year, 0, 1));
          const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
          conditions.push({ deathDate: { gte: startYear, lte: endYear } });
        }
      }
    } else if (deathDateType === "range") {
      // Range logic remains the same
      const yearFrom = parseInt(searchCriteria.deathYearFrom || "", 10);
      const yearTo = parseInt(searchCriteria.deathYearTo || "", 10);
      const rangeConditions: { gte?: Date; lte?: Date } = {};
      if (!isNaN(yearFrom)) {
        const date = new Date(Date.UTC(yearFrom, 0, 1));
        if (!isNaN(date.getTime())) rangeConditions.gte = date;
      }
      if (!isNaN(yearTo)) {
        const date = new Date(Date.UTC(yearTo, 11, 31, 23, 59, 59, 999));
        if (!isNaN(date.getTime())) rangeConditions.lte = date;
      }
      if (Object.keys(rangeConditions).length > 0) {
        conditions.push({ deathDate: rangeConditions });
      }
    }
    // Place conditions
    if (searchCriteria.birthPlace) {
      conditions.push({
        OR: [
          {
            birthCity: {
              name: { contains: searchCriteria.birthPlace, mode: "insensitive" }
            }
          },
          {
            birthCity: {
              province: {
                contains: searchCriteria.birthPlace,
                mode: "insensitive"
              }
            }
          },
          {
            birthCity: {
              country: {
                name: {
                  contains: searchCriteria.birthPlace,
                  mode: "insensitive"
                }
              }
            }
          }
        ]
      });
    }
    if (searchCriteria.deathPlace) {
      conditions.push({
        OR: [
          {
            deathCity: {
              name: { contains: searchCriteria.deathPlace, mode: "insensitive" }
            }
          },
          {
            deathCity: {
              province: {
                contains: searchCriteria.deathPlace,
                mode: "insensitive"
              }
            }
          },
          {
            deathCity: {
              country: {
                name: {
                  contains: searchCriteria.deathPlace,
                  mode: "insensitive"
                }
              }
            }
          }
        ]
      });
    }
    // Combine all conditions with AND
    if (conditions.length > 0) {
      where.AND = conditions;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;

    // Perform the search query and count query in parallel
    const [results, totalCount] = await prisma.$transaction([
      prisma.obituary.findMany({
        where,
        select: {
          reference: true,
          givenNames: true,
          surname: true,
          maidenName: true,
          birthDate: true,
          deathDate: true
        },
        orderBy: { deathDate: "desc" }, // Example sorting
        skip,
        take: pageSize
      }),
      prisma.obituary.count({ where })
    ]);

    // Format results
    const formattedResults: SearchResult[] = results.map(obit => ({
      reference: obit.reference,
      givenNames: obit.givenNames,
      surname: obit.surname,
      maidenName: obit.maidenName,
      birthDate: obit.birthDate,
      deathDate: obit.deathDate
    }));

    return { data: { results: formattedResults, totalCount } };
  } catch (error) {
    console.error("Error in searchObituaries action:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid search input." };
    }
    return { error: "An unexpected error occurred during the search." };
  }
}
