/*
  Warnings:

  - You are about to drop the column `lastGeolocationPingDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastGeolocationPingLatitude` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastGeolocationPingLongitude` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "lastGeolocationPingDate",
DROP COLUMN "lastGeolocationPingLatitude",
DROP COLUMN "lastGeolocationPingLongitude",
ADD COLUMN     "lastPingDate" TIMESTAMP(3),
ADD COLUMN     "lastPingGeohash" TEXT;
