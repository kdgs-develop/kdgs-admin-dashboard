import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://dashboard.kdgs.ca";

  // Main search page
  const mainPages = [
    {
      url: `${baseUrl}/public/search`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0
    }
  ];

  // Generate alphabetical listing pages (A-Z)
  const alphabeticalPages = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .map(letter => ({
      url: `${baseUrl}/public/search/surname/${letter}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8
    }));

  return [...mainPages, ...alphabeticalPages];
}
