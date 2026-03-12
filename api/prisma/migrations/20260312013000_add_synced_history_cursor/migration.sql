-- CreateTable
CREATE TABLE "SyncedHistoryCursor" (
    "cursor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncedHistoryCursor_pkey" PRIMARY KEY ("cursor")
);
