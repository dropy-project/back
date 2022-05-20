-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('TEXT', 'PICTURE', 'VIDEO', 'MUSIC');

-- CreateTable
CREATE TABLE "DropyMedia" (
    "id" SERIAL NOT NULL,
    "dropyId" INTEGER NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "mediaId" INTEGER NOT NULL,

    CONSTRAINT "DropyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextDropy" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "TextDropy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DropyMedia_dropyId_key" ON "DropyMedia"("dropyId");

-- AddForeignKey
ALTER TABLE "DropyMedia" ADD CONSTRAINT "DropyMedia_dropyId_fkey" FOREIGN KEY ("dropyId") REFERENCES "Dropy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
