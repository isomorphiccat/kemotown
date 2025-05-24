-- CreateTable
CREATE TABLE "UserMisskeyAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "misskeyUserId" TEXT NOT NULL,
    "apiToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMisskeyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMisskeyChannel" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventMisskeyChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMisskeyAccount_userId_key" ON "UserMisskeyAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventMisskeyChannel_eventId_key" ON "EventMisskeyChannel"("eventId");

-- AddForeignKey
ALTER TABLE "UserMisskeyAccount" ADD CONSTRAINT "UserMisskeyAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventMisskeyChannel" ADD CONSTRAINT "EventMisskeyChannel_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;