import { findMatches } from "./history.repository"

export type GetMatchesParams = {
	limit: number
	offset: number
}

export type PaginatedMatches = {
	items: Array<Record<string, unknown>>
	paging: {
		limit: number
		offset: number
		total: number
	}
}

export async function getMatches({
	limit,
	offset
}: GetMatchesParams): Promise<PaginatedMatches> {
	const { matches, total } = await findMatches({
		limit,
		offset
	})

	return {
		items: matches.map((match: Awaited<typeof matches>[number]) => ({
			...match,
			time: match.time.toString()
		})),
		paging: {
			limit,
			offset,
			total
		}
	}
}
