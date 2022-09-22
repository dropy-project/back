/*
  Warnings:

  - The values [NONE] on the enum `MediaType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MediaType_new" AS ENUM ('TEXT', 'PICTURE', 'VIDEO', 'MUSIC');
ALTER TABLE "Dropy" ALTER COLUMN "mediaType" DROP DEFAULT;
ALTER TABLE "Dropy" ALTER COLUMN "mediaType" TYPE "MediaType_new" USING ("mediaType"::text::"MediaType_new");
ALTER TYPE "MediaType" RENAME TO "MediaType_old";
ALTER TYPE "MediaType_new" RENAME TO "MediaType";
DROP TYPE "MediaType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Dropy" ALTER COLUMN "mediaType" DROP DEFAULT;
