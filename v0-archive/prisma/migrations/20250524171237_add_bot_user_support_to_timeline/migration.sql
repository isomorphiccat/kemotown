-- AlterTable
ALTER TABLE "TimelinePost" ADD COLUMN     "botUserId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "TimelinePost_botUserId_createdAt_idx" ON "TimelinePost"("botUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "TimelinePost" ADD CONSTRAINT "TimelinePost_botUserId_fkey" FOREIGN KEY ("botUserId") REFERENCES "BotUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
