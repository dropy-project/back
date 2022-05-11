/*
  Warnings:

  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Oui` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[UID]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `UID` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `displayName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registerDate` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `User_email_key` ON `User`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `email`,
    DROP COLUMN `password`,
    ADD COLUMN `UID` VARCHAR(191) NOT NULL,
    ADD COLUMN `displayName` VARCHAR(191) NOT NULL,
    ADD COLUMN `registerDate` DATETIME(3) NOT NULL,
    ADD COLUMN `userName` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `Oui`;

-- CreateIndex
CREATE UNIQUE INDEX `User_UID_key` ON `User`(`UID`);

-- CreateIndex
CREATE UNIQUE INDEX `User_userName_key` ON `User`(`userName`);
