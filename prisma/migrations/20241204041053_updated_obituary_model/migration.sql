/*
  Warnings:

  - You are about to drop the column `birthCountryId` on the `Obituary` table. All the data in the column will be lost.
  - You are about to drop the column `deathCountryId` on the `Obituary` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Obituary" DROP CONSTRAINT "Obituary_birthCountryId_fkey";

-- DropForeignKey
ALTER TABLE "Obituary" DROP CONSTRAINT "Obituary_deathCountryId_fkey";

-- AlterTable
ALTER TABLE "Obituary" DROP COLUMN "birthCountryId",
DROP COLUMN "deathCountryId";
