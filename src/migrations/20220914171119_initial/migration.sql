-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('NONE', 'TEXT', 'PICTURE', 'VIDEO', 'MUSIC');

-- CreateEnum
CREATE TYPE "Pronouns" AS ENUM ('UNKNOWN', 'HE_HIM', 'SHE_HER', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "registerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceToken" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "lastLoginDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "newsLetter" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "pronouns" "Pronouns" NOT NULL DEFAULT 'UNKNOWN',
    "about" TEXT,
    "isDeveloper" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isAmbassador" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "lastPingDate" TIMESTAMP(3),
    "lastPingGeohash" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dropy" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emitterId" INTEGER NOT NULL,
    "retrieverId" INTEGER,
    "retrieveDate" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geohash" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaData" TEXT,
    "mediaType" "MediaType" NOT NULL DEFAULT 'NONE',
    "chatConversationId" INTEGER,

    CONSTRAINT "Dropy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" SERIAL NOT NULL,
    "creationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "content" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "dropyId" INTEGER,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "senderId" INTEGER NOT NULL,
    "reportedId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dropyId" INTEGER,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_blockedUsers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ChatConversationToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "_blockedUsers_AB_unique" ON "_blockedUsers"("A", "B");

-- CreateIndex
CREATE INDEX "_blockedUsers_B_index" ON "_blockedUsers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChatConversationToUser_AB_unique" ON "_ChatConversationToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChatConversationToUser_B_index" ON "_ChatConversationToUser"("B");

-- AddForeignKey
ALTER TABLE "Dropy" ADD CONSTRAINT "emitterId" FOREIGN KEY ("emitterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dropy" ADD CONSTRAINT "retrieverId" FOREIGN KEY ("retrieverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dropy" ADD CONSTRAINT "Dropy_chatConversationId_fkey" FOREIGN KEY ("chatConversationId") REFERENCES "ChatConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_dropyId_fkey" FOREIGN KEY ("dropyId") REFERENCES "Dropy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_dropyId_fkey" FOREIGN KEY ("dropyId") REFERENCES "Dropy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blockedUsers" ADD CONSTRAINT "_blockedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_blockedUsers" ADD CONSTRAINT "_blockedUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatConversationToUser" ADD CONSTRAINT "_ChatConversationToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatConversationToUser" ADD CONSTRAINT "_ChatConversationToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
