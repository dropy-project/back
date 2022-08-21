-- CreateEnum
CREATE TYPE "Pronouns" AS ENUM ('UNKOWN', 'HE_HIM', 'SHE_HER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "about" TEXT,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "pronouns" "Pronouns" NOT NULL DEFAULT 'UNKOWN';
