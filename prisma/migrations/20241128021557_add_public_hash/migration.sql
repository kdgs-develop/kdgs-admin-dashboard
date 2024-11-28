/*
  Warnings:

  - A unique constraint covering the columns `[publicHash]` on the table `Obituary` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Obituary" ADD COLUMN     "publicHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Obituary_publicHash_key" ON "Obituary"("publicHash");
