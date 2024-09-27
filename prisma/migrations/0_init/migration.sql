-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VIEWER', 'INDEXER', 'SCANNER', 'PROOFREADER', 'ADMIN');

-- CreateTable
CREATE TABLE "Genealogist" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT,
    "phone" TEXT,
    "lastAccessAt" TIMESTAMP(3),
    "clerkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "Role" DEFAULT 'INDEXER',
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Genealogist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessTime" (
    "id" SERIAL NOT NULL,
    "genealogistId" SMALLINT,
    "loginAt" TIMESTAMP(3),
    "logoutAt" TIMESTAMP(3),

    CONSTRAINT "AccessTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obituary" (
    "id" SERIAL NOT NULL,
    "reference" CHAR(8) NOT NULL,
    "surname" TEXT,
    "titleId" SMALLINT,
    "givenNames" TEXT,
    "maidenName" TEXT,
    "birthDate" DATE,
    "birthCityId" SMALLINT,
    "deathDate" DATE,
    "deathCityId" SMALLINT,
    "burialCemetery" TEXT,
    "cemeteryId" SMALLINT,
    "place" TEXT,
    "periodicalId" SMALLINT,
    "publishDate" DATE,
    "page" VARCHAR(8),
    "column" VARCHAR(8),
    "notes" TEXT,
    "proofread" BOOLEAN NOT NULL DEFAULT false,
    "proofreadDate" DATE,
    "proofreadBy" TEXT,
    "enteredBy" TEXT,
    "enteredOn" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "editedBy" TEXT,
    "editedOn" TIMESTAMP(3),
    "fileBoxId" SMALLINT,

    CONSTRAINT "Obituary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relative" (
    "id" SERIAL NOT NULL,
    "obituaryId" INTEGER NOT NULL,
    "surname" TEXT,
    "givenNames" TEXT,
    "relationship" TEXT,
    "predeceased" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Relative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlsoKnownAs" (
    "id" SERIAL NOT NULL,
    "obituaryId" INTEGER NOT NULL,
    "surname" TEXT,
    "otherNames" TEXT,

    CONSTRAINT "AlsoKnownAs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "province" TEXT,
    "countryId" INTEGER,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cemetery" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "cityId" SMALLINT,

    CONSTRAINT "Cemetery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Periodical" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "Periodical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Title" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileBox" (
    "id" SERIAL NOT NULL,
    "year" SMALLINT NOT NULL,
    "number" SMALLINT NOT NULL,

    CONSTRAINT "FileBox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Genealogist_clerkId_key" ON "Genealogist"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Obituary_reference_key" ON "Obituary"("reference");

-- AddForeignKey
ALTER TABLE "AccessTime" ADD CONSTRAINT "AccessTime_genealogistId_fkey" FOREIGN KEY ("genealogistId") REFERENCES "Genealogist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_birthCityId_fkey" FOREIGN KEY ("birthCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_cemeteryId_fkey" FOREIGN KEY ("cemeteryId") REFERENCES "Cemetery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_deathCityId_fkey" FOREIGN KEY ("deathCityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_fileBoxId_fkey" FOREIGN KEY ("fileBoxId") REFERENCES "FileBox"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_periodicalId_fkey" FOREIGN KEY ("periodicalId") REFERENCES "Periodical"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obituary" ADD CONSTRAINT "Obituary_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relative" ADD CONSTRAINT "Relative_obituaryId_fkey" FOREIGN KEY ("obituaryId") REFERENCES "Obituary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlsoKnownAs" ADD CONSTRAINT "AlsoKnownAs_obituaryId_fkey" FOREIGN KEY ("obituaryId") REFERENCES "Obituary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cemetery" ADD CONSTRAINT "Cemetery_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

