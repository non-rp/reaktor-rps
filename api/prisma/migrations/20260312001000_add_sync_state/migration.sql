-- CreateTable
CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "nextCursor" TEXT,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "triggerSource" TEXT,
    "pagesProcessed" INTEGER NOT NULL DEFAULT 0,
    "matchesFetched" INTEGER NOT NULL DEFAULT 0,
    "matchesCreated" INTEGER NOT NULL DEFAULT 0,
    "matchesUpdated" INTEGER NOT NULL DEFAULT 0,
    "invalidMatches" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastStartedAt" TIMESTAMP(3),
    "lastCompletedAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);
