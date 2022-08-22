/*
  Warnings:

  - You are about to drop the column `profileScore` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileScore";

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "reportedId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_blockedUsers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_blockedUsers_AB_unique" ON "_blockedUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_blockedUsers_B_index" ON "_blockedUsers"("B");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blockedUsers" ADD CONSTRAINT "_blockedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blockedUsers" ADD CONSTRAINT "_blockedUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
