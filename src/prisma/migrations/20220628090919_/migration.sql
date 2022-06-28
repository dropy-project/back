/*
  Warnings:

  - Added the required column `lastSeenDate` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastSeenLocationLatitude` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastSeenLocationLongitude` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeenDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "lastSeenLocationLatitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "lastSeenLocationLongitude" DOUBLE PRECISION NOT NULL;
