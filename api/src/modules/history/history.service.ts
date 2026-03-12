import { findMatches } from "./history.repository"
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
	filters: {
		from: string | null
		to: string | null
		playerId: number | null
		playerName: string | null
	}
}

export async function getMatches({
	limit,
	offset,
	from,
	to,
	playerId,
	playerName
}: GetMatchesParams): Promise<PaginatedMatches> {
	const { matches, total } = await findMatches({
		limit,
		offset,
		from,
		to,
		playerId,
		playerName
	})

	return {
		items: matches.map((match: Awaited<typeof matches>[number]) => serializeMatch(match)),
		paging: {
			limit,
			offset,
			total
		},
		filters: {
			from: from?.toISOString() ?? null,
			to: to?.toISOString() ?? null,
			playerId: playerId ?? null,
			playerName: playerName ?? null
		}
	}
}
