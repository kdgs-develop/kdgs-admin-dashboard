/*
  Warnings:

  - A unique constraint covering the columns `[successToken]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerCountry" TEXT,
ADD COLUMN     "customerFullName" TEXT,
ADD COLUMN     "successToken" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_successToken_key" ON "Order"("successToken");
