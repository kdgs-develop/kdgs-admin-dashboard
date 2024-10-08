-- CreateTable
CREATE TABLE "Image" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "extension" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Image_name_key" ON "Image"("name");
