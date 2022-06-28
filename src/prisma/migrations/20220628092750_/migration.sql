-- AlterTable
ALTER TABLE "User" ALTER COLUMN "lastSeenDate" DROP NOT NULL,
ALTER COLUMN "lastSeenLocationLatitude" DROP NOT NULL,
ALTER COLUMN "lastSeenLocationLongitude" DROP NOT NULL;
