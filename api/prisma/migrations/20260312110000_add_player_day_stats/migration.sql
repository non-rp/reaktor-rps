-- CreateTable
CREATE TABLE "PlayerDayStat" (
    "playerId" INTEGER NOT NULL,
    "day" DATE NOT NULL,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "invalidMatches" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlayerDayStat_pkey" PRIMARY KEY ("playerId","day")
);

-- CreateIndex
CREATE INDEX "PlayerDayStat_day_idx" ON "PlayerDayStat"("day");

-- CreateIndex
CREATE INDEX "PlayerDayStat_wins_idx" ON "PlayerDayStat"("wins");

-- AddForeignKey
ALTER TABLE "PlayerDayStat" ADD CONSTRAINT "PlayerDayStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill aggregated daily stats from existing matches
INSERT INTO "PlayerDayStat" ("playerId", "day", "matches", "wins", "losses", "draws", "invalidMatches")
SELECT
    stats."playerId",
    stats."day",
    COUNT(*)::INTEGER AS "matches",
    COALESCE(SUM(CASE WHEN stats."outcome" = 'WIN' THEN 1 ELSE 0 END), 0)::INTEGER AS "wins",
    COALESCE(SUM(CASE WHEN stats."outcome" = 'LOSS' THEN 1 ELSE 0 END), 0)::INTEGER AS "losses",
    COALESCE(SUM(CASE WHEN stats."outcome" = 'DRAW' THEN 1 ELSE 0 END), 0)::INTEGER AS "draws",
    COALESCE(SUM(CASE WHEN stats."outcome" = 'INVALID' THEN 1 ELSE 0 END), 0)::INTEGER AS "invalidMatches"
FROM (
    SELECT
        "playerAId" AS "playerId",
        to_timestamp("time" / 1000.0)::date AS "day",
        CASE
            WHEN NOT "isValid" THEN 'INVALID'
            WHEN "result" = 'DRAW' THEN 'DRAW'
            WHEN "result" = 'A' THEN 'WIN'
            WHEN "result" = 'B' THEN 'LOSS'
            ELSE 'INVALID'
        END AS "outcome"
    FROM "Match"
    UNION ALL
    SELECT
        "playerBId" AS "playerId",
        to_timestamp("time" / 1000.0)::date AS "day",
        CASE
            WHEN NOT "isValid" THEN 'INVALID'
            WHEN "result" = 'DRAW' THEN 'DRAW'
            WHEN "result" = 'B' THEN 'WIN'
            WHEN "result" = 'A' THEN 'LOSS'
            ELSE 'INVALID'
        END AS "outcome"
    FROM "Match"
) AS stats
GROUP BY stats."playerId", stats."day";
