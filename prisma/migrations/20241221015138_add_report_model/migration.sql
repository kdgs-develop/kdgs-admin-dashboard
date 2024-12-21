-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "totalResults" INTEGER NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Genealogist"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
