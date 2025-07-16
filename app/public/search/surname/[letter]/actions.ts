"use server";

import { prisma } from "@/lib/prisma";
import { SearchResult } from "@/lib/actions/public-search/search-obituaries";

const PAGE_SIZE = 100;

export async function getObituariesByLetter(letter: string, page: number) {
  const where = {
    surname: {
      startsWith: letter,
      mode: "insensitive" as const
    }
  };

  try {
    const [results, totalCount] = await Promise.all([
      prisma.obituary.findMany({
        where,
        select: {
          reference: true,
          givenNames: true,
          surname: true,
          maidenName: true,
          birthDate: true,
          deathDate: true,
          publicHash: true
        },
        orderBy: [{ surname: "asc" }, { givenNames: "asc" }],
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE
      }),
      prisma.obituary.count({ where })
    ]);

    return {
      results: results as SearchResult[],
      totalCount
    };
  } catch (error) {
    console.error("Failed to fetch obituaries by letter:", error);
    return {
      results: [],
      totalCount: 0,
      error: "Database error. Please try again later."
    };
  }
}
