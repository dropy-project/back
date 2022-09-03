/*
  Warnings:

  - Added the required column `geohash` to the `Dropy` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Dropy" ADD COLUMN     "geohash" TEXT NOT NULL;
