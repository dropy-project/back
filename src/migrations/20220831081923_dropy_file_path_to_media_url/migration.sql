/*
  Warnings:

  - You are about to drop the column `filePath` on the `Dropy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Dropy" DROP COLUMN "filePath",
ADD COLUMN     "mediaUrl" TEXT;
