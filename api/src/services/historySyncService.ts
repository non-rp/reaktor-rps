import { prisma } from "../db/prisma"
import { fetchHistory } from "../clients/rspApiClient"
import { getWinner, validateMove } from "../utils/winner"
import type { MatchResult, ValidMove } from "../types/match"

export type HistorySyncSummary = {
	pagesProcessed: number
	matchesFetched: number
	matchesCreated: number
	matchesUpdated: number
	invalidMatches: number
}

export async function syncHistory(): Promise<HistorySyncSummary> {
	const summary: HistorySyncSummary = {
		pagesProcessed: 0,
		matchesFetched: 0,
		matchesCreated: 0,
		matchesUpdated: 0,
		invalidMatches: 0
	}

	let cursor: string | undefined

	do {

		const page = await fetchHistory(cursor)
		summary.pagesProcessed += 1

		for (const match of page.data) {
			summary.matchesFetched += 1
			const matchTime = normalizeMatchTime(match.time)
			const playerA = await prisma.player.upsert({
				where: { name: match.playerA.name },
				update: {},
				create: { name: match.playerA.name }
			})

			const playerB = await prisma.player.upsert({
				where: { name: match.playerB.name },
				update: {},
				create: { name: match.playerB.name }
			})

			const playerAMove = validateMove(match.playerA.played)
			const playerBMove = validateMove(match.playerB.played)
			const isValid = playerAMove.isValid && playerBMove.isValid

			if (!isValid) {
				summary.invalidMatches += 1
			}

			const invalidReason = buildInvalidReason(playerAMove, playerBMove)
			const result: MatchResult = isValid
				? getWinner(
					playerAMove.normalized as ValidMove,
					playerBMove.normalized as ValidMove
				)
				: "INVALID"

			const winnerId =
				result === "A" ? playerA.id :
				result === "B" ? playerB.id :
				null

			const existingMatch = await prisma.match.findUnique({
				where: { gameId: match.gameId },
				select: { id: true }
			})

			await prisma.match.upsert({

				where: { gameId: match.gameId },

				update: {
					time: matchTime,
					playerAId: playerA.id,
					playerBId: playerB.id,
					playerAMove: match.playerA.played,
					playerBMove: match.playerB.played,
					playerAMoveValid: playerAMove.isValid,
					playerBMoveValid: playerBMove.isValid,
					isValid,
					invalidReason,
					result,
					winnerId
				},

				create: {

					gameId: match.gameId,
					time: matchTime,
					playerAId: playerA.id,
					playerBId: playerB.id,
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

			if (existingMatch) {
				summary.matchesUpdated += 1
			} else {
				summary.matchesCreated += 1
			}

		}

		cursor = page.cursor
	} while (cursor)

	return summary
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
