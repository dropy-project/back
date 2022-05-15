-- AlterTable
ALTER TABLE "Dropy" ADD COLUMN     "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "registerDate" SET DEFAULT CURRENT_TIMESTAMP;

-- RenameForeignKey
ALTER TABLE "Dropy" RENAME CONSTRAINT "Dropy_id_fkey" TO "emitterId";
