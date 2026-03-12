import type { MatchResult } from "../../../types/match"

export type HistorySyncSummary = {
	pagesProcessed: number
	matchesFetched: number
	matchesCreated: number
	matchesUpdated: number
	invalidMatches: number
}

export type HistorySyncState = HistorySyncSummary & {
	nextCursor: string | null
	isRunning: boolean
	triggerSource: string | null
	lastError: string | null
	lastStartedAt: string | null
	lastCompletedAt: string | null
	lastHeartbeatAt: string | null
}

export type PreparedMatch = {
	gameId: string
	time: bigint
	playerAId: number
	playerBId: number
	playerAMove: string
	playerBMove: string
	playerAMoveValid: boolean
	playerBMoveValid: boolean
	isValid: boolean
	invalidReason: string | null
	result: MatchResult
	winnerId: number | null
}
