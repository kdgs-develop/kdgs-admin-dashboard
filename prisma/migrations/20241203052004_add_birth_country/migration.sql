-- AlterTable
ALTER TABLE "Obituary" ADD COLUMN     "birthCountryId" SMALLINT,
ADD COLUMN     "deathCountryId" SMALLINT;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_birthCountryId_fkey" FOREIGN KEY ("birthCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_deathCountryId_fkey" FOREIGN KEY ("deathCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
