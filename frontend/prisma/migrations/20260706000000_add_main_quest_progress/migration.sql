-- CreateTable
CREATE TABLE "MainQuestProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MainQuestProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MainQuestProgress_userId_questType_targetId_key" ON "MainQuestProgress"("userId", "questType", "targetId");

-- CreateIndex
CREATE INDEX "MainQuestProgress_userId_questType_idx" ON "MainQuestProgress"("userId", "questType");

-- AddForeignKey
ALTER TABLE "MainQuestProgress" ADD CONSTRAINT "MainQuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
