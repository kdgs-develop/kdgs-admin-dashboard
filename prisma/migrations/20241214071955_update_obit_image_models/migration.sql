-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "reference" TEXT;

-- CreateIndex
CREATE INDEX "Obituary_reference_idx" ON "Obituary"("reference");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_reference_fkey" FOREIGN KEY ("reference") REFERENCES "Obituary"("reference") ON DELETE SET NULL ON UPDATE CASCADE;
