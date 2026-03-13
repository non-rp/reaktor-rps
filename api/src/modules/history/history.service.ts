import { findHistoryDateRange, findMatches } from "./history.repository"
import { serializeMatch } from "./history.mapper"

export type GetMatchesParams = {
	limit: number
	offset: number
	from?: Date
	to?: Date
	playerId?: number
	playerName?: string
}

export type PaginatedMatches = {
	items: Array<Record<string, unknown>>
	paging: {
		limit: number
		offset: number
		total: number
	}
	range: {
		from: string | null
		to: string | null
	}
	filters: {
		from: string | null
		to: string | null
		playerId: number | null
		playerName: string | null
	}
}

export type HistoryDateRange = {
	from: string | null
	to: string | null
}

export async function getMatches({
	limit,
	offset,
	from,
	to,
	playerId,
	playerName
}: GetMatchesParams): Promise<PaginatedMatches> {
	const [{ matches, total }, range] = await Promise.all([
		findMatches({
			limit,
			offset,
			from,
			to,
			playerId,
			playerName
		}),
		getHistoryDateRange()
	])

	return {
		items: matches.map((match: Awaited<typeof matches>[number]) => serializeMatch(match)),
		paging: {
			limit,
			offset,
			total
		},
		range,
		filters: {
			from: from?.toISOString() ?? null,
			to: to?.toISOString() ?? null,
			playerId: playerId ?? null,
			playerName: playerName ?? null
		}
	}
}

export async function getHistoryDateRange(): Promise<HistoryDateRange> {
	const { minTime, maxTime } = await findHistoryDateRange()

	return {
		from: minTime ? toIsoDate(minTime) : null,
		to: maxTime ? toIsoDate(maxTime) : null
	}
}

function toIsoDate(value: bigint): string {
	return new Date(Number(value)).toISOString().slice(0, 10)
}
