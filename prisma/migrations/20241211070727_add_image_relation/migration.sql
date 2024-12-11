-- AlterTable
ALTER TABLE "ImageFile" ADD COLUMN     "reference" TEXT;

-- AddForeignKey
ALTER TABLE "ImageFile" ADD CONSTRAINT "ImageFile_reference_fkey" FOREIGN KEY ("reference") REFERENCES "Obituary"("reference") ON DELETE SET NULL ON UPDATE CASCADE;
