import { prisma } from "../../../db/prisma"
import { getWinner, validateMove } from "../../../utils/winner"
import type { ValidMove } from "../../../types/match"
import type { RawGameResult } from "../../../types/raw"
import type { PreparedMatch } from "./historySyncTypes"
import { Prisma } from "@prisma/client"

export async function upsertHistoryMatches(
	matches: RawGameResult[],
	playerIdCache: Map<string, number>
): Promise<{
	matchesCreated: number
	matchesUpdated: number
	invalidMatches: number
}> {
	const playerIds = await ensurePlayers(matches, playerIdCache)
	const preparedMatches = prepareMatches(matches, playerIds)
	const existingMatches = await loadExistingMatches(preparedMatches.map((match) => match.gameId))

	const matchesToCreate = preparedMatches.filter((match) => !existingMatches.has(match.gameId))
	const matchesToUpdate = preparedMatches.filter((match) => existingMatches.has(match.gameId))

	const affectedDays = new Set<string>()

	for (const match of matchesToCreate) {
		affectedDays.add(getMatchDay(match.time))
	}

	for (const match of matchesToUpdate) {
		affectedDays.add(getMatchDay(match.time))

		const existingMatch = existingMatches.get(match.gameId)

		if (existingMatch) {
			affectedDays.add(getMatchDay(existingMatch.time))
		}
	}

	await prisma.$transaction(async (tx) => {
		if (matchesToCreate.length > 0) {
			await tx.match.createMany({
				data: matchesToCreate,
				skipDuplicates: true
			})
		}

		for (const match of matchesToUpdate) {
			await tx.match.update({
				where: { gameId: match.gameId },
				data: {
					time: match.time,
					playerAId: match.playerAId,
					playerBId: match.playerBId,
					playerAMove: match.playerAMove,
					playerBMove: match.playerBMove,
					playerAMoveValid: match.playerAMoveValid,
					playerBMoveValid: match.playerBMoveValid,
					isValid: match.isValid,
					invalidReason: match.invalidReason,
					result: match.result,
					winnerId: match.winnerId
				}
			})
		}

		if (affectedDays.size > 0) {
			await refreshPlayerDayStats(tx, [...affectedDays])
		}
	})

	return {
		matchesCreated: matchesToCreate.length,
		matchesUpdated: matchesToUpdate.length,
		invalidMatches: preparedMatches.filter((match) => !match.isValid).length
	}
}

async function ensurePlayers(
	matches: RawGameResult[],
	playerIdCache: Map<string, number>
): Promise<Map<string, number>> {
	const playerNames = [...new Set(
		matches.flatMap((match) => [match.playerA.name, match.playerB.name])
	)]

	const uncachedPlayerNames = playerNames.filter((name) => !playerIdCache.has(name))

	if (uncachedPlayerNames.length === 0) {
		return playerIdCache
	}

	const existingPlayers = await prisma.player.findMany({
		where: {
			name: {
				in: uncachedPlayerNames
			}
		},
		select: {
			id: true,
			name: true
		}
	})

	for (const player of existingPlayers) {
		playerIdCache.set(player.name, player.id)
	}

	const missingPlayerNames = uncachedPlayerNames.filter((name) => !playerIdCache.has(name))

	if (missingPlayerNames.length > 0) {
		await prisma.player.createMany({
			data: missingPlayerNames.map((name) => ({ name })),
			skipDuplicates: true
		})

		const createdPlayers = await prisma.player.findMany({
			where: {
				name: {
					in: missingPlayerNames
				}
			},
			select: {
				id: true,
				name: true
			}
		})

		for (const player of createdPlayers) {
			playerIdCache.set(player.name, player.id)
		}
	}

	return playerIdCache
}

function prepareMatches(
	matches: RawGameResult[],
	playerIds: Map<string, number>
): PreparedMatch[] {
	return matches.map((match) => {
		const playerAId = playerIds.get(match.playerA.name)
		const playerBId = playerIds.get(match.playerB.name)

		if (!playerAId || !playerBId) {
			throw new Error(`Failed to resolve player ids for match ${match.gameId}`)
		}

		const playerAMove = validateMove(match.playerA.played)
		const playerBMove = validateMove(match.playerB.played)
		const isValid = playerAMove.isValid && playerBMove.isValid
		const invalidReason = buildInvalidReason(playerAMove, playerBMove)
		const result = isValid
			? getWinner(
				playerAMove.normalized as ValidMove,
				playerBMove.normalized as ValidMove
			)
			: "INVALID"

		const winnerId =
			result === "A" ? playerAId :
			result === "B" ? playerBId :
			null

		return {
			gameId: match.gameId,
			time: normalizeMatchTime(match.time),
			playerAId,
			playerBId,
			playerAMove: match.playerA.played,
			playerBMove: match.playerB.played,
			playerAMoveValid: playerAMove.isValid,
			playerBMoveValid: playerBMove.isValid,
			isValid,
			invalidReason,
			result,
			winnerId
		}
	})
}

async function loadExistingMatches(gameIds: string[]): Promise<Map<string, {
	gameId: string
	time: bigint
}>> {
	if (gameIds.length === 0) {
		return new Map()
	}

	const existingMatches = await prisma.match.findMany({
		where: {
			gameId: {
				in: gameIds
			}
		},
		select: {
			gameId: true,
			time: true
		}
	})

	return new Map(existingMatches.map((match) => [match.gameId, match]))
}

async function refreshPlayerDayStats(
	tx: Prisma.TransactionClient,
	days: string[]
): Promise<void> {
	const uniqueDays = [...new Set(days)]

	for (const day of uniqueDays) {
		const dayDate = new Date(`${day}T00:00:00.000Z`)

		await tx.playerDayStat.deleteMany({
			where: {
				day: dayDate
			}
		})

		const stats = await tx.$queryRaw<Array<{
			playerId: number
			day: Date
			matches: number
			wins: number
			losses: number
			draws: number
			invalidMatches: number
		}>>(Prisma.sql`
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
				WHERE to_timestamp("time" / 1000.0)::date = ${dayDate}::date
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
				WHERE to_timestamp("time" / 1000.0)::date = ${dayDate}::date
			) AS stats
			GROUP BY stats."playerId", stats."day"
		`)

		if (stats.length > 0) {
			await tx.playerDayStat.createMany({
				data: stats
			})
		}
	}
}

function getMatchDay(time: bigint): string {
	return new Date(Number(time)).toISOString().slice(0, 10)
}

function buildInvalidReason(
	playerAMove: ReturnType<typeof validateMove>,
	playerBMove: ReturnType<typeof validateMove>
): string | null {
	const reasons: string[] = []

	if (!playerAMove.isValid) {
		reasons.push(`playerA move "${playerAMove.raw}" is invalid`)
	}

	if (!playerBMove.isValid) {
		reasons.push(`playerB move "${playerBMove.raw}" is invalid`)
	}

	return reasons.length > 0 ? reasons.join("; ") : null
}

function normalizeMatchTime(value: number | string): bigint {
	if (typeof value === "number") {
		return BigInt(value)
	}

	const parsedDate = Date.parse(value)

	if (!Number.isNaN(parsedDate)) {
		return BigInt(parsedDate)
	}

	if (/^\d+$/.test(value)) {
		return BigInt(value)
	}

	throw new Error(`Unsupported match time value: ${value}`)
}
