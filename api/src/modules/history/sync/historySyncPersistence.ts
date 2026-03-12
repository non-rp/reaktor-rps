import { prisma } from "../../../db/prisma"
import { getWinner, validateMove } from "../../../utils/winner"
import type { ValidMove } from "../../../types/match"
import type { RawGameResult } from "../../../types/raw"
import type { PreparedMatch } from "./historySyncTypes"

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
	const existingGameIds = await loadExistingGameIds(preparedMatches.map((match) => match.gameId))

	const matchesToCreate = preparedMatches.filter((match) => !existingGameIds.has(match.gameId))
	const matchesToUpdate = preparedMatches.filter((match) => existingGameIds.has(match.gameId))

	if (matchesToCreate.length > 0) {
		await prisma.match.createMany({
			data: matchesToCreate,
			skipDuplicates: true
		})
	}

	if (matchesToUpdate.length > 0) {
		await prisma.$transaction(
			matchesToUpdate.map((match) =>
				prisma.match.update({
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
			)
		)
	}

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

async function loadExistingGameIds(gameIds: string[]): Promise<Set<string>> {
	if (gameIds.length === 0) {
		return new Set<string>()
	}

	const existingMatches = await prisma.match.findMany({
		where: {
			gameId: {
				in: gameIds
			}
		},
		select: {
			gameId: true
		}
	})

	return new Set(existingMatches.map((match) => match.gameId))
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
