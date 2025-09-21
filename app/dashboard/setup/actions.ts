"use server";

import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { fetchOrdersMonthlyData } from "@/app/actions/fetchOrdersMonthlyData";

interface CreateGenealogistParams {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  password: string;
}

interface UpdateGenealogistParams {
  id: number;
  phone?: string;
  role?: string;
}

export async function createGenealogist({
  firstName,
  lastName,
  email,
  phone,
  role,
  password
}: CreateGenealogistParams) {
  try {
    // Create user in Clerk (without phone number)
    const clerkUser = await clerkClient().users.createUser({
      firstName,
      lastName,
      emailAddress: [email],
      password
    });

    // Create user in our database (including phone number)
    const genealogist = await prisma.genealogist.create({
      data: {
        fullName: `${firstName} ${lastName}`,
        phone,
        clerkId: clerkUser.id,
        role: role as Role
      }
    });

    return { ...genealogist, email };
  } catch (error) {
    console.error("Error creating genealogist:", error);
    throw error;
  }
}

export async function deleteGenealogist(id: number) {
  try {
    const genealogist = await prisma.genealogist.findUnique({ where: { id } });
    if (!genealogist) throw new Error("Genealogist not found");

    // Delete user from Clerk
    await clerkClient().users.deleteUser(genealogist.clerkId);

    // Delete user from our database
    await prisma.genealogist.delete({ where: { id } });
  } catch (error) {
    console.error("Error deleting genealogist:", error);
    throw error;
  }
}

export async function getGenealogists() {
  try {
    const genealogists = await prisma.genealogist.findMany({
      select: {
        id: true,
        clerkId: true,
        fullName: true,
        phone: true,
        role: true
      }
    });

    const genealogistsWithEmail = await Promise.all(
      genealogists.map(async genealogist => {
        try {
          const clerkUser = await clerkClient().users.getUser(
            genealogist.clerkId
          );
          return {
            ...genealogist,
            email: clerkUser.emailAddresses[0]?.emailAddress || ""
          };
        } catch (error) {
          // If Clerk user not found, return genealogist with empty email
          console.warn(
            `Clerk user not found for genealogist ${genealogist.id}`
          );
          return {
            ...genealogist,
            email: ""
          };
        }
      })
    );

    // Filter out genealogists with empty emails
    return genealogistsWithEmail.filter(g => g.email);
  } catch (error) {
    console.error("Error fetching genealogists:", error);
    throw error;
  }
}

export async function updateGenealogist({
  id,
  phone,
  role
}: UpdateGenealogistParams) {
  try {
    const genealogist = await prisma.genealogist.findUnique({ where: { id } });
    if (!genealogist) throw new Error("Genealogist not found");

    // Update user in our database
    const updatedGenealogist = await prisma.genealogist.update({
      where: { id },
      data: {
        phone,
        role: role as Role
      }
    });

    // Update user role in Clerk if it has changed
    if (role) {
      await clerkClient().users.updateUser(genealogist.clerkId, {
        publicMetadata: { role }
      });
    }

    return updatedGenealogist;
  } catch (error) {
    console.error("Error updating genealogist:", error);
    throw error;
  }
}

export async function updateGenealogistPassword(
  id: number,
  newPassword: string
) {
  try {
    const genealogist = await prisma.genealogist.findUnique({ where: { id } });
    if (!genealogist) throw new Error("Genealogist not found");

    await clerkClient().users.updateUser(genealogist.clerkId, {
      password: newPassword
    });

    return true;
  } catch (error) {
    console.error("Error updating genealogist password:", error);
    throw error;
  }
}

export async function getCities(): Promise<
  Prisma.CityGetPayload<{ include: { country: true } }>[]
> {
  try {
    const cities = await prisma.city.findMany({
      include: {
        country: true
      },
      orderBy: {
        country: {
          name: "asc"
        }
      }
    });

    return cities as Prisma.CityGetPayload<{ include: { country: true } }>[];
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw new Error("Failed to fetch cities");
  }
}

export async function addCity(
  name: string | null,
  province: string | null,
  countryId: number
) {
  try {
    // Check for existing city with exact match including null values
    const existingCity = await prisma.city.findFirst({
      where: {
        AND: [
          { name: name }, // This will match null with null
          { province: province }, // This will match null with null
          { countryId: countryId }
        ]
      }
    });

    if (existingCity) {
      throw new Error(
        "A location with these exact details already exists in the database"
      );
    }

    // Create the new city
    const newCity = await prisma.city.create({
      data: {
        name,
        province,
        countryId
      },
      include: {
        country: true
      }
    });

    revalidatePath("/dashboard/reports");

    return {
      id: newCity.id,
      name: newCity.name,
      province: newCity.province,
      country: { name: newCity.country?.name ?? "" }
    };
  } catch (error) {
    console.error("Error adding new city:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("A location with these details already exists");
      }
    }
    throw error;
  }
}

export async function getCountries(page: number = 1, pageSize: number = 5) {
  try {
    const totalCount = await prisma.country.count();
    const countries = await prisma.country.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true
      }
    });

    return {
      countries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw new Error("Failed to fetch countries");
  }
}

export async function searchCountries(
  searchTerm: string,
  page: number = 1,
  pageSize: number = 5
) {
  try {
    const where: Prisma.CountryWhereInput = {
      name: {
        contains: searchTerm,
        mode: Prisma.QueryMode.insensitive
      }
    };

    const totalCount = await prisma.country.count({ where });

    const countries = await prisma.country.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true
      }
    });

    return {
      countries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error searching countries:", error);
    throw new Error("Failed to search countries");
  }
}

export async function addCountry(name: string) {
  try {
    const existing = await prisma.country.findFirst({
      where: { name: { equals: name, mode: "insensitive" } }
    });

    if (existing) {
      throw new Error("A country with this name already exists");
    }

    const newCountry = await prisma.country.create({
      data: { name }
    });

    // Add revalidation for the setup page
    revalidatePath("/dashboard/reports");

    return newCountry;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add country");
  }
}

export async function getFileBoxes() {
  try {
    const fileBoxes = await prisma.fileBox.findMany({
      orderBy: {
        year: "desc"
      }
    });
    return fileBoxes;
  } catch (error) {
    throw new Error("Failed to fetch file boxes");
  }
}

export async function searchFileBoxes(year?: number, number?: number) {
  try {
    const whereClause: any = {};
    if (year) whereClause.year = year;
    if (number) whereClause.number = number;

    const fileBoxes = await prisma.fileBox.findMany({
      where: whereClause,
      orderBy: [{ year: "desc" }, { number: "asc" }]
    });
    return fileBoxes;
  } catch (error) {
    console.error("Error searching file boxes:", error);
    throw new Error("Failed to search file boxes");
  }
}

export async function addFileBox(year: number, number: number) {
  try {
    // First check if the file box already exists
    const existing = await prisma.fileBox.findFirst({
      where: {
        AND: [{ year }, { number }]
      }
    });

    if (existing) {
      throw new Error(
        "A file box with this year and number combination already exists"
      );
    }

    const fileBox = await prisma.fileBox.create({
      data: {
        year,
        number
      }
    });
    return fileBox;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("A file box with this combination already exists");
      }
    }
    throw error;
  }
}

export async function updateFileBox(id: number, year: number, number: number) {
  try {
    // First check if another file box exists with the same year and number
    const existing = await prisma.fileBox.findFirst({
      where: {
        AND: [
          { year },
          { number },
          { NOT: { id } } // Exclude the current file box
        ]
      }
    });

    if (existing) {
      throw new Error(
        "A file box with this year and number combination already exists"
      );
    }

    const fileBox = await prisma.fileBox.update({
      where: { id },
      data: {
        year,
        number
      }
    });
    return fileBox;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("A file box with this combination already exists");
      }
    }
    throw error;
  }
}

export async function deleteFileBox(id: number) {
  try {
    // Check if the file box is being used by any obituaries
    const fileBox = await prisma.fileBox.findUnique({
      where: { id },
      include: { obituaries: { select: { id: true } } }
    });

    if (fileBox?.obituaries.length) {
      throw new Error(
        "Cannot delete file box that is being used by obituaries"
      );
    }

    await prisma.fileBox.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete file box");
  }
}

export async function getCountriesWithPagination(
  page: number,
  pageSize: number = 5
) {
  try {
    const totalCount = await prisma.country.count();
    const countries = await prisma.country.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: "asc"
      }
    });

    return {
      countries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw new Error("Failed to fetch countries");
  }
}

export async function deleteCountry(id: number) {
  try {
    // Check if the country is being used by any cities
    const citiesUsingCountry = await prisma.city.count({
      where: { countryId: id }
    });

    if (citiesUsingCountry > 0) {
      throw new Error("Cannot delete country as it is being used by cities");
    }

    await prisma.country.delete({
      where: { id }
    });
    revalidatePath("/dashboard/reports");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete country");
  }
}

export async function updateCountry(id: number, name: string) {
  try {
    const existing = await prisma.country.findFirst({
      where: {
        AND: [{ name: { equals: name, mode: "insensitive" } }, { NOT: { id } }]
      }
    });

    if (existing) {
      throw new Error("A country with this name already exists");
    }

    const country = await prisma.country.update({
      where: { id },
      data: { name }
    });
    revalidatePath("/dashboard/reports");
    return country;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update country");
  }
}

export async function getCitiesWithPagination(
  page: number,
  pageSize: number = 10
) {
  try {
    const totalCount = await prisma.city.count();
    const cities = await prisma.city.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: "asc"
      },
      include: {
        country: true
      }
    });

    return {
      cities,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw new Error("Failed to fetch cities");
  }
}

export async function updateCity(
  id: number,
  name: string | null,
  province: string | null,
  countryId: number
) {
  try {
    const city = await prisma.city.update({
      where: { id },
      data: {
        name,
        province,
        countryId
      },
      include: {
        country: true
      }
    });
    return city;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update city");
  }
}

export async function deleteCity(id: number) {
  try {
    // Check if the city is being used by any obituaries or cemeteries
    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        obituaries_birthCityId: { select: { id: true } },
        obituaries_deathCityId: { select: { id: true } },
        cemeteries: { select: { id: true } }
      }
    });

    if (
      city?.obituaries_birthCityId.length ||
      city?.obituaries_deathCityId.length ||
      city?.cemeteries.length
    ) {
      throw new Error(
        "Cannot delete city that is being used by obituaries or cemeteries"
      );
    }

    await prisma.city.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete city");
  }
}

export async function searchCities(
  name?: string,
  province?: string,
  countryId?: number,
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const where: any = {};

    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive"
      };
    }

    if (province) {
      where.province = {
        contains: province,
        mode: "insensitive"
      };
    }

    if (countryId) {
      where.countryId = countryId;
    }

    const totalCount = await prisma.city.count({ where });

    const cities = await prisma.city.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [
        {
          name: {
            sort: "asc",
            nulls: "first" // This will put empty names at the beginning
          }
        }
      ],
      include: {
        country: true
      }
    });

    return {
      cities,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error searching cities:", error);
    throw new Error("Failed to search cities");
  }
}

export async function getCemeteriesWithPagination(
  page: number,
  pageSize: number = 5
) {
  try {
    const totalCount = await prisma.cemetery.count();
    const cemeteries = await prisma.cemetery.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: "asc"
      },
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });

    return {
      cemeteries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error fetching cemeteries:", error);
    throw new Error("Failed to fetch cemeteries");
  }
}

export async function searchCemeteries(
  name?: string,
  cityId?: number,
  page: number = 1,
  pageSize: number = 5
) {
  try {
    const where: any = {};

    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive"
      };
    }

    if (cityId) {
      where.cityId = cityId;
    }

    const totalCount = await prisma.cemetery.count({ where });

    const cemeteries = await prisma.cemetery.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        name: "asc"
      },
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });

    return {
      cemeteries,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error searching cemeteries:", error);
    throw new Error("Failed to search cemeteries");
  }
}

export async function addCemetery(name: string | null, cityId: number | null) {
  try {
    const cemetery = await prisma.cemetery.create({
      data: {
        name,
        cityId
      },
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });
    return cemetery;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add cemetery");
  }
}

export async function updateCemetery(
  id: number,
  name: string | null,
  cityId: number | null
) {
  try {
    const cemetery = await prisma.cemetery.update({
      where: { id },
      data: {
        name,
        cityId
      },
      include: {
        city: {
          include: {
            country: true
          }
        }
      }
    });
    return cemetery;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update cemetery");
  }
}

export async function deleteCemetery(id: number) {
  try {
    // Check if the cemetery is being used by any obituaries
    const cemetery = await prisma.cemetery.findUnique({
      where: { id },
      include: {
        obituaries: { select: { id: true } }
      }
    });

    if (cemetery?.obituaries.length) {
      throw new Error(
        "Cannot delete cemetery that is being used by obituaries"
      );
    }

    await prisma.cemetery.delete({
      where: { id }
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete cemetery");
  }
}

export async function getPeriodicals(page: number = 1, pageSize: number = 5) {
  try {
    const totalCount = await prisma.periodical.count();
    const periodicals = await prisma.periodical.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        url: true,
        city: {
          include: {
            country: true
          }
        },
        _count: {
          select: {
            obituaries: true
          }
        }
      }
    });

    return {
      periodicals,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error fetching periodicals:", error);
    throw new Error("Failed to fetch periodicals");
  }
}

export async function searchPeriodicals(
  searchTerm: string,
  page: number = 1,
  pageSize: number = 5
) {
  try {
    const where: Prisma.PeriodicalWhereInput = {
      name: {
        contains: searchTerm,
        mode: Prisma.QueryMode.insensitive
      }
    };

    const totalCount = await prisma.periodical.count({ where });

    const periodicals = await prisma.periodical.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        url: true,
        city: {
          include: {
            country: true
          }
        },
        _count: {
          select: {
            obituaries: true
          }
        }
      }
    });

    return {
      periodicals,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error searching periodicals:", error);
    throw new Error("Failed to search periodicals");
  }
}

export async function addPeriodical(
  name: string,
  url?: string | null,
  cityId?: number | null
) {
  const existing = await prisma.periodical.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive"
      }
    }
  });

  if (existing) {
    throw new Error("A periodical with this name already exists");
  }

  const periodical = await prisma.periodical.create({
    data: {
      name,
      url: url || null,
      cityId: cityId || null
    },
    include: {
      city: {
        include: {
          country: true
        }
      }
    }
  });

  revalidatePath("/dashboard/reports");
  return periodical;
}

export async function updatePeriodical(
  id: number,
  name: string,
  url?: string | null,
  cityId?: number | null
) {
  const existing = await prisma.periodical.findFirst({
    where: {
      AND: [{ name: { equals: name, mode: "insensitive" } }, { NOT: { id } }]
    }
  });

  if (existing) {
    throw new Error("A periodical with this name already exists");
  }

  const periodical = await prisma.periodical.update({
    where: { id },
    data: {
      name,
      url: url || null,
      cityId: cityId || null
    },
    include: {
      city: {
        include: {
          country: true
        }
      }
    }
  });

  revalidatePath("/dashboard/reports");
  return periodical;
}

export async function deletePeriodical(id: number) {
  try {
    // Check if the periodical is being used by any obituaries
    const obituariesUsingPeriodical = await prisma.obituary.count({
      where: { periodicalId: id }
    });

    if (obituariesUsingPeriodical > 0) {
      throw new Error(
        "Cannot delete periodical as it is being used by obituaries"
      );
    }

    await prisma.periodical.delete({
      where: { id }
    });
    revalidatePath("/dashboard/reports");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete periodical");
  }
}

export async function getTitles(page: number = 1, pageSize: number = 5) {
  try {
    const totalCount = await prisma.title.count();
    const titles = await prisma.title.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true
      }
    });

    return {
      titles,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error fetching titles:", error);
    throw new Error("Failed to fetch titles");
  }
}

export async function searchTitles(
  searchTerm: string,
  page: number = 1,
  pageSize: number = 5
) {
  try {
    const where: Prisma.TitleWhereInput = {
      name: {
        contains: searchTerm,
        mode: Prisma.QueryMode.insensitive
      }
    };

    const totalCount = await prisma.title.count({ where });

    const titles = await prisma.title.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true
      }
    });

    return {
      titles,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("Error searching titles:", error);
    throw new Error("Failed to search titles");
  }
}

export async function addTitle(name: string) {
  try {
    const existing = await prisma.title.findFirst({
      where: { name: { equals: name, mode: "insensitive" } }
    });

    if (existing) {
      throw new Error("A title with this name already exists");
    }

    const newTitle = await prisma.title.create({
      data: { name }
    });
    revalidatePath("/dashboard/reports");
    return newTitle;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add title");
  }
}

export async function updateTitle(id: number, name: string) {
  try {
    const existing = await prisma.title.findFirst({
      where: {
        AND: [{ name: { equals: name, mode: "insensitive" } }, { NOT: { id } }]
      }
    });

    if (existing) {
      throw new Error("A title with this name already exists");
    }

    const title = await prisma.title.update({
      where: { id },
      data: { name }
    });
    revalidatePath("/dashboard/reports");
    return title;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update title");
  }
}

export async function deleteTitle(id: number) {
  try {
    const obituariesUsingTitle = await prisma.obituary.count({
      where: { titleId: id }
    });

    if (obituariesUsingTitle > 0) {
      throw new Error("Cannot delete title as it is being used by obituaries");
    }

    await prisma.title.delete({
      where: { id }
    });
    revalidatePath("/dashboard/reports");
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete title");
  }
}

export async function getObituaryCountForFileBox(
  fileBoxId: number
): Promise<number> {
  try {
    const count = await prisma.obituary.count({
      where: {
        fileBoxId: fileBoxId
      }
    });
    return count;
  } catch (error) {
    console.error("Error fetching obituary count for file box:", error);
    throw new Error("Failed to fetch obituary count");
  }
}

export async function getOpenFileBoxId(): Promise<number> {
  const setting = await prisma.settings.findUnique({
    where: {
      id: "open_filebox_id"
    }
  });

  return setting ? parseInt(setting.value) : 0; // Return 0 if no setting found
}

export async function setOpenFileBoxId(id: number) {
  try {
    await prisma.settings.upsert({
      where: {
        id: "open_filebox_id"
      },
      update: {
        value: id.toString()
      },
      create: {
        id: "open_filebox_id",
        value: id.toString()
      }
    });
    return true;
  } catch (error) {
    console.error("Error setting open file box:", error);
    throw new Error("Failed to set open file box");
  }
}

export async function getRelationships(page: number, perPage: number) {
  const skip = (page - 1) * perPage;
  const [relationships, totalCount] = await prisma.$transaction([
    prisma.familyRelationship.findMany({
      skip,
      take: perPage,
      orderBy: { name: "asc" }
    }),
    prisma.familyRelationship.count()
  ]);

  return {
    relationships,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage)
  };
}

export async function searchRelationships(
  searchTerm: string,
  page: number,
  perPage: number
) {
  const skip = (page - 1) * perPage;
  const [relationships, totalCount] = await prisma.$transaction([
    prisma.familyRelationship.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: "insensitive"
        }
      },
      skip,
      take: perPage,
      orderBy: { name: "asc" }
    }),
    prisma.familyRelationship.count({
      where: {
        name: {
          contains: searchTerm,
          mode: "insensitive"
        }
      }
    })
  ]);

  return {
    relationships,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage)
  };
}

export async function addRelationship(name: string, category: string) {
  const existing = await prisma.familyRelationship.findFirst({
    where: { name: { equals: name, mode: "insensitive" } }
  });

  if (existing) {
    throw new Error("A relationship with this name already exists");
  }

  const relationship = await prisma.familyRelationship.create({
    data: { name, category }
  });
  revalidatePath("/dashboard/reports");
  return relationship;
}

export async function updateRelationship(
  id: string,
  name: string,
  category: string
) {
  const existing = await prisma.familyRelationship.findFirst({
    where: {
      AND: [{ name: { equals: name, mode: "insensitive" } }, { NOT: { id } }]
    }
  });

  if (existing) {
    throw new Error("A relationship with this name already exists");
  }

  const relationship = await prisma.familyRelationship.update({
    where: { id },
    data: { name, category }
  });
  revalidatePath("/dashboard/reports");
  return relationship;
}

export async function deleteRelationship(id: string) {
  await prisma.familyRelationship.delete({
    where: { id }
  });
  revalidatePath("/dashboard/reports");
}

export async function getBatchNumbers(
  page: number,
  itemsPerPage: number,
  completionStatus?: "all" | "complete" | "incomplete",
  sortOrder: "createdAt" | "number" | "latestEditDate" = "createdAt",
  editorRoleFilter: string = "all"
) {
  try {
    const skip = (page - 1) * itemsPerPage;

    // Get batch numbers with their obituary counts and latest edit date
    const batchNumbersWithCounts = await prisma.batchNumber.findMany({
      include: {
        createdBy: {
          select: {
            fullName: true
          }
        },
        _count: {
          select: {
            obituaries: true
          }
        },
        obituaries: {
          orderBy: {
            editedOn: "desc"
          },
          take: 1,
          select: {
            id: true,
            editedOn: true,
            editedBy: true
          }
        }
      },
      orderBy: {
        [sortOrder === "latestEditDate" ? "createdAt" : sortOrder]:
          sortOrder === "createdAt" || sortOrder === "latestEditDate"
            ? "desc"
            : "asc"
      }
    });

    // Get genealogist information for each batch number's latest obituary
    const batchNumbersWithLatestEdit = await Promise.all(
      batchNumbersWithCounts.map(async batch => {
        // Get the latest edit date and editor if there are any obituaries
        const latestEditDate =
          batch.obituaries.length > 0 ? batch.obituaries[0].editedOn : null;

        // Use the editedBy field directly - it already contains the full name
        let latestEditorName = null;
        let latestEditorRole = null;

        if (batch.obituaries.length > 0 && batch.obituaries[0].editedBy) {
          latestEditorName = batch.obituaries[0].editedBy;

          // Try to find the genealogist by name to get their role
          const genealogist = await prisma.genealogist.findFirst({
            where: {
              fullName: batch.obituaries[0].editedBy
            },
            select: {
              role: true
            }
          });

          if (genealogist?.role) {
            latestEditorRole = genealogist.role;
          }
        }

        // Return the batch without the obituaries array but with latestEditDate, editor and role
        const { obituaries, ...batchWithoutObituaries } = batch;
        return {
          ...batchWithoutObituaries,
          latestEditDate,
          latestEditorName,
          latestEditorRole
        };
      })
    );

    // If sorting by latestEditDate, we need to do it manually after getting the data
    let sortedBatchNumbers = batchNumbersWithLatestEdit;
    if (sortOrder === "latestEditDate") {
      sortedBatchNumbers = [...batchNumbersWithLatestEdit].sort((a, b) => {
        // Handle null values (null comes after dates)
        if (a.latestEditDate === null && b.latestEditDate === null) return 0;
        if (a.latestEditDate === null) return 1;
        if (b.latestEditDate === null) return -1;

        // Sort by date descending (newest first)
        return (
          new Date(b.latestEditDate).getTime() -
          new Date(a.latestEditDate).getTime()
        );
      });
    }

    // Filter based on completion status
    let filteredBatchNumbers = sortedBatchNumbers;
    if (completionStatus === "complete") {
      filteredBatchNumbers = sortedBatchNumbers.filter(
        batch => batch._count.obituaries === batch.assignedObituaries
      );
    } else if (completionStatus === "incomplete") {
      filteredBatchNumbers = sortedBatchNumbers.filter(
        batch => batch._count.obituaries !== batch.assignedObituaries
      );
    }

    // Filter by editor role if specified
    if (editorRoleFilter !== "all") {
      filteredBatchNumbers = filteredBatchNumbers.filter(
        batch => batch.latestEditorRole === editorRoleFilter
      );
    }

    // Apply pagination after filtering
    const paginatedBatchNumbers = filteredBatchNumbers.slice(
      skip,
      skip + itemsPerPage
    );
    const totalCount = filteredBatchNumbers.length;

    return {
      batchNumbers: paginatedBatchNumbers,
      totalCount,
      totalPages: Math.ceil(totalCount / itemsPerPage)
    };
  } catch (error) {
    console.error("Error in getBatchNumbers:", error);
    throw error;
  }
}

export async function searchBatchNumbers(
  searchTerm: string,
  page: number,
  itemsPerPage: number,
  completionStatus?: "all" | "complete" | "incomplete",
  sortOrder: "createdAt" | "number" | "latestEditDate" = "createdAt",
  editorRoleFilter: string = "all"
) {
  try {
    const skip = (page - 1) * itemsPerPage;

    // First get all batch numbers matching the search term with their counts and latest edit date
    const batchNumbersWithCounts = await prisma.batchNumber.findMany({
      where: {
        number: {
          contains: searchTerm,
          mode: "insensitive"
        }
      },
      orderBy: {
        [sortOrder === "latestEditDate" ? "createdAt" : sortOrder]:
          sortOrder === "createdAt" || sortOrder === "latestEditDate"
            ? "desc"
            : "asc"
      },
      include: {
        createdBy: {
          select: {
            fullName: true
          }
        },
        _count: {
          select: { obituaries: true }
        },
        obituaries: {
          orderBy: {
            editedOn: "desc"
          },
          take: 1,
          select: {
            id: true,
            editedOn: true,
            editedBy: true
          }
        }
      }
    });

    // Get genealogist information for each batch number's latest obituary
    const batchNumbersWithLatestEdit = await Promise.all(
      batchNumbersWithCounts.map(async batch => {
        // Get the latest edit date and editor if there are any obituaries
        const latestEditDate =
          batch.obituaries.length > 0 ? batch.obituaries[0].editedOn : null;

        // Use the editedBy field directly - it already contains the full name
        let latestEditorName = null;
        let latestEditorRole = null;

        if (batch.obituaries.length > 0 && batch.obituaries[0].editedBy) {
          latestEditorName = batch.obituaries[0].editedBy;

          // Try to find the genealogist by name to get their role
          const genealogist = await prisma.genealogist.findFirst({
            where: {
              fullName: batch.obituaries[0].editedBy
            },
            select: {
              role: true
            }
          });

          if (genealogist?.role) {
            latestEditorRole = genealogist.role;
          }
        }

        // Return the batch without the obituaries array but with latestEditDate, editor and role
        const { obituaries, ...batchWithoutObituaries } = batch;
        return {
          ...batchWithoutObituaries,
          latestEditDate,
          latestEditorName,
          latestEditorRole
        };
      })
    );

    // If sorting by latestEditDate, we need to do it manually after getting the data
    let sortedBatchNumbers = batchNumbersWithLatestEdit;
    if (sortOrder === "latestEditDate") {
      sortedBatchNumbers = [...batchNumbersWithLatestEdit].sort((a, b) => {
        // Handle null values (null comes after dates)
        if (a.latestEditDate === null && b.latestEditDate === null) return 0;
        if (a.latestEditDate === null) return 1;
        if (b.latestEditDate === null) return -1;

        // Sort by date descending (newest first)
        return (
          new Date(b.latestEditDate).getTime() -
          new Date(a.latestEditDate).getTime()
        );
      });
    }

    // Filter based on completion status
    let filteredBatchNumbers = sortedBatchNumbers;
    if (completionStatus === "complete") {
      filteredBatchNumbers = sortedBatchNumbers.filter(
        batch => batch._count.obituaries === batch.assignedObituaries
      );
    } else if (completionStatus === "incomplete") {
      filteredBatchNumbers = sortedBatchNumbers.filter(
        batch => batch._count.obituaries !== batch.assignedObituaries
      );
    }

    // Filter by editor role if specified
    if (editorRoleFilter !== "all") {
      filteredBatchNumbers = filteredBatchNumbers.filter(
        batch => batch.latestEditorRole === editorRoleFilter
      );
    }

    // Apply pagination after filtering
    const paginatedBatchNumbers = filteredBatchNumbers.slice(
      skip,
      skip + itemsPerPage
    );
    const totalCount = filteredBatchNumbers.length;

    return {
      batchNumbers: paginatedBatchNumbers,
      totalCount,
      totalPages: Math.ceil(totalCount / itemsPerPage)
    };
  } catch (error) {
    console.error("Error in searchBatchNumbers:", error);
    throw error;
  }
}

export async function updateBatchNumber(
  id: string,
  number: string,
  assignedObituaries: number
) {
  try {
    const updatedBatchNumber = await prisma.batchNumber.update({
      where: { id },
      data: {
        number,
        assignedObituaries
      },
      include: {
        createdBy: {
          select: {
            fullName: true
          }
        }
      }
    });

    return updatedBatchNumber;
  } catch (error) {
    console.error("Error in updateBatchNumber:", error);
    throw error;
  }
}

export async function deleteBatchNumber(id: string) {
  try {
    // First, remove the batch number reference from any obituaries
    await prisma.obituary.updateMany({
      where: { batchNumberId: id },
      data: { batchNumberId: null }
    });

    // Then delete the batch number
    await prisma.batchNumber.delete({
      where: { id }
    });
  } catch (error) {
    console.error("Error in deleteBatchNumber:", error);
    throw error;
  }
}

export async function cleanupOrphanedGenealogists() {
  try {
    const genealogists = await prisma.genealogist.findMany({
      select: {
        id: true,
        clerkId: true,
        fullName: true
      }
    });

    const cleanupResults = {
      total: genealogists.length,
      cleaned: 0,
      details: [] as string[]
    };

    for (const genealogist of genealogists) {
      try {
        await clerkClient().users.getUser(genealogist.clerkId);
      } catch (error) {
        if ((error as any).status === 404) {
          // First, delete all reports associated with this genealogist
          await prisma.report.deleteMany({
            where: { userId: genealogist.clerkId }
          });

          // Then delete the genealogist
          await prisma.genealogist.delete({
            where: { id: genealogist.id }
          });

          cleanupResults.cleaned++;
          cleanupResults.details.push(
            `Deleted orphaned genealogist: ${genealogist.fullName || genealogist.id}`
          );
        }
      }
    }

    console.log("Cleanup results:", cleanupResults);
    return cleanupResults;
  } catch (error) {
    console.error("Error cleaning up orphaned genealogists:", error);
    throw error;
  }
}

export async function getCitiesByCountryId(countryId: number) {
  try {
    const cities = await prisma.city.findMany({
      where: {
        countryId: countryId
      },
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true,
        province: true
      }
    });

    const count = await prisma.city.count({
      where: {
        countryId: countryId
      }
    });

    return {
      cities: cities as {
        id: number;
        name: string | null;
        province: string | null;
      }[],
      count
    };
  } catch (error) {
    console.error("Error fetching cities by country:", error);
    throw new Error("Failed to fetch cities by country");
  }
}

export async function getObituariesByBirthCityId(cityId: number) {
  try {
    const obituaries = await prisma.obituary.findMany({
      where: {
        birthCityId: cityId
      },
      orderBy: {
        surname: "asc"
      },
      select: {
        id: true,
        reference: true,
        surname: true,
        givenNames: true,
        birthDate: true,
        title: {
          select: {
            name: true
          }
        }
      }
    });

    const count = await prisma.obituary.count({
      where: {
        birthCityId: cityId
      }
    });

    return {
      obituaries,
      count
    };
  } catch (error) {
    console.error("Error fetching obituaries by birth city:", error);
    throw new Error("Failed to fetch obituaries by birth city");
  }
}

export async function getObituariesByCityId(cityId: number) {
  try {
    // Get obituaries where the city is the birth city
    const birthCityObituaries = await prisma.obituary.findMany({
      where: {
        birthCityId: cityId
      },
      orderBy: {
        surname: "asc"
      },
      select: {
        id: true,
        reference: true,
        surname: true,
        givenNames: true,
        birthDate: true,
        deathDate: true,
        title: {
          select: {
            name: true
          }
        }
      }
    });

    // Get obituaries where the city is the death city
    const deathCityObituaries = await prisma.obituary.findMany({
      where: {
        deathCityId: cityId
      },
      orderBy: {
        surname: "asc"
      },
      select: {
        id: true,
        reference: true,
        surname: true,
        givenNames: true,
        birthDate: true,
        deathDate: true,
        title: {
          select: {
            name: true
          }
        }
      }
    });

    // Add a type flag to each obituary to indicate if it's birth or death city
    const birthCityWithType = birthCityObituaries.map(obit => ({
      ...obit,
      relationType: "birth" as const
    }));

    const deathCityWithType = deathCityObituaries.map(obit => ({
      ...obit,
      relationType: "death" as const
    }));

    // Combine both arrays without deduplication
    const combinedObituaries = [...birthCityWithType, ...deathCityWithType];

    // Sort the combined results by surname and then by reference for consistent ordering
    combinedObituaries.sort((a, b) => {
      const surnameA = a.surname || "";
      const surnameB = b.surname || "";

      // First sort by surname
      const surnameCompare = surnameA.localeCompare(surnameB);
      if (surnameCompare !== 0) return surnameCompare;

      // If surnames are the same, sort by reference
      return a.reference.localeCompare(b.reference);
    });

    // Count birth and death separately
    const birthCount = birthCityObituaries.length;
    const deathCount = deathCityObituaries.length;

    // Total count is the sum of both arrays
    const totalCount = birthCount + deathCount;

    return {
      obituaries: combinedObituaries,
      birthCount,
      deathCount,
      totalCount
    };
  } catch (error) {
    console.error("Error fetching obituaries by city:", error);
    throw new Error("Failed to fetch obituaries by city");
  }
}

export async function getObituariesByPeriodicalId(periodicalId: number) {
  try {
    const obituaries = await prisma.obituary.findMany({
      where: {
        periodicalId: periodicalId
      },
      orderBy: {
        surname: "asc"
      },
      select: {
        id: true,
        reference: true,
        surname: true,
        givenNames: true,
        publishDate: true,
        page: true,
        title: {
          select: {
            name: true
          }
        }
      }
    });

    const count = await prisma.obituary.count({
      where: {
        periodicalId: periodicalId
      }
    });

    return {
      obituaries,
      count
    };
  } catch (error) {
    console.error("Error fetching obituaries by periodical:", error);
    throw new Error("Failed to fetch obituaries by periodical");
  }
}

export async function getObituariesByRelationshipId(relationshipId: string) {
  try {
    // First get all relatives that use this relationship
    const relatives = await prisma.relative.findMany({
      where: {
        familyRelationshipId: relationshipId
      },
      select: {
        obituaryId: true
      }
    });

    // Get the unique obituary IDs
    const obituaryIds = Array.from(
      new Set(relatives.map(rel => rel.obituaryId))
    );

    // Fetch the full obituary details for these IDs
    const obituaries = await prisma.obituary.findMany({
      where: {
        id: {
          in: obituaryIds
        }
      },
      orderBy: {
        surname: "asc"
      },
      select: {
        id: true,
        reference: true,
        surname: true,
        givenNames: true,
        birthDate: true,
        deathDate: true,
        title: {
          select: {
            name: true
          }
        },
        relatives: {
          where: {
            familyRelationshipId: relationshipId
          },
          select: {
            surname: true,
            givenNames: true,
            relationship: true,
            predeceased: true
          }
        }
      }
    });

    // Count the total number of obituaries
    const count = obituaryIds.length;

    return {
      obituaries,
      count
    };
  } catch (error) {
    console.error("Error fetching obituaries by relationship:", error);
    throw new Error("Failed to fetch obituaries by relationship");
  }
}

export async function getObituariesByCemeteryId(cemeteryId: number) {
  try {
    const obituaries = await prisma.obituary.findMany({
      where: {
        cemeteryId: cemeteryId
      },
      orderBy: {
        surname: "asc"
      },
      select: {
        id: true,
        reference: true,
        surname: true,
        givenNames: true,
        birthDate: true,
        deathDate: true,
        burialCemetery: true,
        title: {
          select: {
            name: true
          }
        }
      }
    });

    const count = await prisma.obituary.count({
      where: {
        cemeteryId: cemeteryId
      }
    });

    return {
      obituaries,
      count
    };
  } catch (error) {
    console.error("Error fetching obituaries by cemetery:", error);
    throw new Error("Failed to fetch obituaries by cemetery");
  }
}

export async function getObituariesByTitleId(titleId: number) {
  try {
    const obituaries = await prisma.obituary.findMany({
      where: {
        titleId: titleId
      },
      orderBy: {
        surname: "asc"
      },
      select: {
        id: true,
        reference: true,
        surname: true,
        givenNames: true,
        birthDate: true,
        deathDate: true,
        title: {
          select: {
            name: true
          }
        }
      }
    });

    const count = await prisma.obituary.count({
      where: {
        titleId: titleId
      }
    });

    return {
      obituaries,
      count
    };
  } catch (error) {
    console.error("Error fetching obituaries by title:", error);
    throw new Error("Failed to fetch obituaries by title");
  }
}

export async function getCemeteriesByCityId(cityId: number) {
  try {
    // Get all cemeteries associated with this city
    const cemeteries = await prisma.cemetery.findMany({
      where: {
        cityId: cityId
      },
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            obituaries: true
          }
        }
      }
    });

    // Get total count of cemeteries
    const totalCount = cemeteries.length;

    // Transform the data to include the count
    const cemeteriesWithCounts = cemeteries.map(cemetery => ({
      id: cemetery.id,
      name: cemetery.name,
      obituaryCount: cemetery._count.obituaries
    }));

    return {
      cemeteries: cemeteriesWithCounts,
      count: totalCount
    };
  } catch (error) {
    console.error("Error fetching cemeteries by city:", error);
    throw new Error("Failed to fetch cemeteries by city");
  }
}

export async function getPeriodicalsByCityId(cityId: number) {
  try {
    // Get all periodicals associated with this city
    const periodicals = await prisma.periodical.findMany({
      where: {
        cityId: cityId
      },
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true,
        url: true,
        _count: {
          select: {
            obituaries: true
          }
        }
      }
    });

    // Get total count of periodicals
    const totalCount = periodicals.length;

    // Transform the data to include the count
    const periodicalsWithCounts = periodicals.map(periodical => ({
      id: periodical.id,
      name: periodical.name,
      url: periodical.url,
      obituaryCount: periodical._count.obituaries
    }));

    return {
      periodicals: periodicalsWithCounts,
      count: totalCount
    };
  } catch (error) {
    console.error("Error fetching periodicals by city:", error);
    throw new Error("Failed to fetch periodicals by city");
  }
}

export async function getOrders(
  page: number,
  perPage: number,
  memberFilter: "all" | "members" | "non-members" = "all"
) {
  const skip = (page - 1) * perPage;

  // Build where clause based on member filter
  const where: any = {};
  if (memberFilter === "members") {
    where.isMember = true;
  } else if (memberFilter === "non-members") {
    where.isMember = false;
  }

  const [orders, totalCount] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage)
  };
}

export async function searchOrders(
  searchTerm: string,
  page: number,
  perPage: number,
  memberFilter: "all" | "members" | "non-members" = "all"
) {
  const skip = (page - 1) * perPage;

  // Build where clause based on search term and member filter
  const where: any = {
    OR: [
      { customerEmail: { contains: searchTerm, mode: "insensitive" } },
      { customerFullName: { contains: searchTerm, mode: "insensitive" } },
      { id: { contains: searchTerm, mode: "insensitive" } }
    ]
  };

  // Add member filter condition
  if (memberFilter === "members") {
    where.isMember = true;
  } else if (memberFilter === "non-members") {
    where.isMember = false;
  }

  const [orders, totalCount] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      }
    }),
    prisma.order.count({ where })
  ]);

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage)
  };
}

export async function getOrderItems(orderId: string) {
  try {
    // First, get the order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Return all items and count
    return {
      items: order.items,
      order: {
        id: order.id,
        customerEmail: order.customerEmail,
        customerFullName: order.customerFullName,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        isMember: order.isMember
      },
      count: order.items.length
    };
  } catch (error) {
    console.error("Error fetching order items:", error);
    throw new Error("Failed to fetch order items");
  }
}

export async function updateOrderStatus(id: string, status: string) {
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { status: status as any }
    });
    revalidatePath("/dashboard/reports");
    return order;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Failed to update order status");
  }
}

export async function deleteOrder(id: string) {
  try {
    await prisma.order.delete({
      where: { id }
    });
    revalidatePath("/dashboard/reports");
  } catch (error) {
    console.error("Error deleting order:", error);
    throw new Error("Failed to delete order");
  }
}

export async function getOrderCounts() {
  try {
    const [totalCount, memberCount, nonMemberCount] = await prisma.$transaction(
      [
        prisma.order.count(),
        prisma.order.count({
          where: { isMember: true }
        }),
        prisma.order.count({
          where: { isMember: false }
        })
      ]
    );

    return {
      totalCount,
      memberCount,
      nonMemberCount
    };
  } catch (error) {
    console.error("Error getting order counts:", error);
    throw new Error("Failed to get order counts");
  }
}

export async function getMonthlyOrdersData(year?: number) {
  try {
    const currentYear = year || new Date().getFullYear();
    return await fetchOrdersMonthlyData(currentYear);
  } catch (error) {
    console.error("Error fetching monthly orders data:", error);
    throw new Error("Failed to fetch monthly orders data");
  }
}
