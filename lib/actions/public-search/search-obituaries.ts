"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Obituary } from "@prisma/client";

const relativeSchema = z.object({
  name: z.string().optional(),
  relationshipId: z.string().optional()
});

// Define a schema for the expected input, including pagination
const searchInputSchema = z.object({
  surname: z.string().optional(),
  givenNames: z.string().optional(),
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

    // Name conditions
    if (searchCriteria.surname) {
      where.surname = { contains: searchCriteria.surname, mode: "insensitive" };
    }
    if (searchCriteria.givenNames) {
      where.givenNames = {
        contains: searchCriteria.givenNames,
        mode: "insensitive"
      };
    }
    // Add Maiden Name search
    if (searchCriteria.surname) {
      if (where.OR) {
        where.OR.push({
          maidenName: { contains: searchCriteria.surname, mode: "insensitive" }
        });
      } else {
        where.OR = [
          { surname: where.surname },
          {
            maidenName: {
              contains: searchCriteria.surname,
              mode: "insensitive"
            }
          }
        ];
        delete where.surname;
      }
    }
    // Also Known As
    if (searchCriteria.alsoKnownAs) {
      where.alsoKnownAs = {
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
      };
    }
    // Relatives
    if (searchCriteria.relatives && searchCriteria.relatives.length > 0) {
      const relativeConditions = searchCriteria.relatives
        .map(rel => {
          const condition: any = {};
          if (rel.name) {
            condition.OR = [
              { surname: { contains: rel.name, mode: "insensitive" } },
              { givenNames: { contains: rel.name, mode: "insensitive" } }
            ];
          }
          if (rel.relationshipId) {
            condition.familyRelationshipId = rel.relationshipId;
          }
          return rel.name || rel.relationshipId ? condition : null;
        })
        .filter(Boolean);
      if (relativeConditions.length > 0) {
        where.AND = (where.AND || []).concat(
          relativeConditions.map(cond => ({ relatives: { some: cond } }))
        );
      }
    }
    // Birth Date
    const birthDateType = searchCriteria.birthDateType ?? "exact";
    if (birthDateType === "exact") {
      const year = parseInt(searchCriteria.birthYear || "", 10);
      const month = parseInt(searchCriteria.birthMonth || "", 10);
      const day = parseInt(searchCriteria.birthDay || "", 10);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        // Basic validation
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          // Create target date object (YYYY-MM-DD 00:00:00 UTC)
          const targetDate = new Date(Date.UTC(year, month - 1, day));

          // Check if date is valid after creation
          if (!isNaN(targetDate.getTime())) {
            // Use equals comparison - Prisma should handle matching against DATE column
            where.birthDate = { equals: targetDate };
          } else {
            console.warn(
              `Invalid exact birth date components: ${year}-${month}-${day}`
            );
            // Fallback to year search
            const startYear = new Date(Date.UTC(year, 0, 1));
            const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
            if (!isNaN(startYear.getTime())) {
              where.birthDate = { gte: startYear, lte: endYear };
            }
          }
        } else {
          // Fallback to year search
          const startYear = new Date(Date.UTC(year, 0, 1));
          const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
          if (!isNaN(startYear.getTime())) {
            where.birthDate = { gte: startYear, lte: endYear };
          }
        }
      } else if (!isNaN(year)) {
        // Only year provided
        const startYear = new Date(Date.UTC(year, 0, 1));
        const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        if (!isNaN(startYear.getTime())) {
          where.birthDate = { gte: startYear, lte: endYear };
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
      if (Object.keys(rangeConditions).length > 0)
        where.birthDate = rangeConditions;
    }
    // Death Date
    const deathDateType = searchCriteria.deathDateType ?? "exact";
    if (deathDateType === "exact") {
      const year = parseInt(searchCriteria.deathYear || "", 10);
      const month = parseInt(searchCriteria.deathMonth || "", 10);
      const day = parseInt(searchCriteria.deathDay || "", 10);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const targetDate = new Date(Date.UTC(year, month - 1, day));
          if (!isNaN(targetDate.getTime())) {
            where.deathDate = { equals: targetDate };
          } else {
            console.warn(
              `Invalid exact death date components: ${year}-${month}-${day}`
            );
            const startYear = new Date(Date.UTC(year, 0, 1));
            const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
            if (!isNaN(startYear.getTime())) {
              where.deathDate = { gte: startYear, lte: endYear };
            }
          }
        } else {
          const startYear = new Date(Date.UTC(year, 0, 1));
          const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
          if (!isNaN(startYear.getTime())) {
            where.deathDate = { gte: startYear, lte: endYear };
          }
        }
      } else if (!isNaN(year)) {
        const startYear = new Date(Date.UTC(year, 0, 1));
        const endYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
        if (!isNaN(startYear.getTime())) {
          where.deathDate = { gte: startYear, lte: endYear };
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
      if (Object.keys(rangeConditions).length > 0)
        where.deathDate = rangeConditions;
    }
    // Place conditions
    if (searchCriteria.birthPlace) {
      where.birthCity = {
        OR: [
          {
            name: { contains: searchCriteria.birthPlace, mode: "insensitive" }
          },
          {
            province: {
              contains: searchCriteria.birthPlace,
              mode: "insensitive"
            }
          },
          {
            country: {
              name: { contains: searchCriteria.birthPlace, mode: "insensitive" }
            }
          }
        ]
      };
    }
    if (searchCriteria.deathPlace) {
      where.deathCity = {
        OR: [
          {
            name: { contains: searchCriteria.deathPlace, mode: "insensitive" }
          },
          {
            province: {
              contains: searchCriteria.deathPlace,
              mode: "insensitive"
            }
          },
          {
            country: {
              name: { contains: searchCriteria.deathPlace, mode: "insensitive" }
            }
          }
        ]
      };
    }
    // --- End of where clause building ---

    console.log(
      "Prisma Query Where Clause (Using equals for exact date):",
      JSON.stringify(where, null, 2)
    );

    // Use Promise.all to fetch results and total count concurrently
    const [results, totalCount] = await Promise.all([
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
        skip: (page - 1) * pageSize,
        take: pageSize
        // Add orderBy if needed, e.g., orderBy: { surname: 'asc' }
      }),
      prisma.obituary.count({ where })
    ]);

    return { data: { results, totalCount } };
  } catch (error) {
    console.error("Search error:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid search input." };
    }
    return { error: "An unexpected error occurred during the search." };
  }
}
