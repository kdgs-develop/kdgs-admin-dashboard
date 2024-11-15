-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
