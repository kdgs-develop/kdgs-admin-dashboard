-- AlterTable
ALTER TABLE "Relative" ADD COLUMN     "familyRelationshipId" TEXT;

-- CreateTable
CREATE TABLE "FamilyRelationship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "FamilyRelationship_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Relative" ADD CONSTRAINT "Relative_familyRelationshipId_fkey" FOREIGN KEY ("familyRelationshipId") REFERENCES "FamilyRelationship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
