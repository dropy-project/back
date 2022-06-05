/*
  Warnings:

  - You are about to drop the column `receiveDate` on the `Dropy` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `Dropy` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Dropy" DROP CONSTRAINT "receiverId";

-- AlterTable
ALTER TABLE "Dropy" DROP COLUMN "receiveDate",
DROP COLUMN "receiverId",
ADD COLUMN     "retrieveDate" TIMESTAMP(3),
ADD COLUMN     "retrieverId" INTEGER;

-- AddForeignKey
ALTER TABLE "Dropy" ADD CONSTRAINT "retrieverId" FOREIGN KEY ("retrieverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
