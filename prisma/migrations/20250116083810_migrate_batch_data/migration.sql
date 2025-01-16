-- AlterTable
ALTER TABLE "Obituary" ADD COLUMN     "batchNumberId" TEXT;

-- CreateTable
CREATE TABLE "BatchNumber" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "BatchNumber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BatchNumber_number_key" ON "BatchNumber"("number");

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_batchNumberId_fkey" FOREIGN KEY ("batchNumberId") REFERENCES "BatchNumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchNumber" ADD CONSTRAINT "BatchNumber_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Genealogist"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
