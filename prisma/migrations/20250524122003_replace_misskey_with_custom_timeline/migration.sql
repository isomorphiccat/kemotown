-- Drop Misskey Integration Tables
DROP TABLE IF EXISTS "EventMisskeyChannel";
DROP TABLE IF EXISTS "UserMisskeyAccount";

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('GLOBAL', 'EVENT');

-- CreateEnum
CREATE TYPE "BotType" AS ENUM ('SYSTEM', 'WELCOME', 'EVENT_NOTIFY', 'EVENT_MOD', 'EVENT_HELPER');

-- CreateTable
CREATE TABLE "TimelinePost" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "channelType" "ChannelType" NOT NULL DEFAULT 'GLOBAL',
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "botType" "BotType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelinePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "mentionedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "botType" "BotType" NOT NULL,
    "eventId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimelinePost_channelType_createdAt_idx" ON "TimelinePost"("channelType", "createdAt");

-- CreateIndex
CREATE INDEX "TimelinePost_eventId_createdAt_idx" ON "TimelinePost"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "TimelinePost_userId_createdAt_idx" ON "TimelinePost"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_postId_userId_emoji_key" ON "Reaction"("postId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "Reaction_postId_idx" ON "Reaction"("postId");

-- CreateIndex
CREATE INDEX "Mention_postId_idx" ON "Mention"("postId");

-- CreateIndex
CREATE INDEX "Mention_mentionedId_idx" ON "Mention"("mentionedId");

-- CreateIndex
CREATE UNIQUE INDEX "BotUser_username_key" ON "BotUser"("username");

-- CreateIndex
CREATE INDEX "BotUser_botType_idx" ON "BotUser"("botType");

-- CreateIndex
CREATE INDEX "BotUser_eventId_idx" ON "BotUser"("eventId");

-- AddForeignKey
ALTER TABLE "TimelinePost" ADD CONSTRAINT "TimelinePost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelinePost" ADD CONSTRAINT "TimelinePost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TimelinePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TimelinePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_mentionedId_fkey" FOREIGN KEY ("mentionedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotUser" ADD CONSTRAINT "BotUser_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;