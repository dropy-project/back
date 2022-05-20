/*
  Warnings:

  - You are about to drop the column `mediaId` on the `DropyMedia` table. All the data in the column will be lost.
  - You are about to drop the `TextDropy` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `filePath` to the `DropyMedia` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DropyMedia" DROP COLUMN "mediaId",
ADD COLUMN     "filePath" TEXT NOT NULL;

-- DropTable
DROP TABLE "TextDropy";
