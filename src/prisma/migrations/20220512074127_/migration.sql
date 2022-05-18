-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "UID" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "registerDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_UID_key" ON "User"("UID");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
