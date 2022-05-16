/*
  Warnings:

  - Added the required column `emitterId` to the `Dropy` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Dropy" DROP CONSTRAINT "emitterId";

-- AlterTable
ALTER TABLE "Dropy" ADD COLUMN     "emitterId" INTEGER NOT NULL,
ADD COLUMN     "receiverId" INTEGER;

-- AddForeignKey
ALTER TABLE "Dropy" ADD CONSTRAINT "emitterId" FOREIGN KEY ("emitterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dropy" ADD CONSTRAINT "receiverId" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
