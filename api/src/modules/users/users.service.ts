import { getMatches } from "../history/history.service"
import {
	findLeaderboard,
	findLatestLeaderboardDay,
	findUserById,
	findUsers,
	getUserStats,
	type FindUsersParams,
	type UserStatsFilters,
	type UserStatsRow
} from "./users.repository"

export type UserListResponse = {
	items: Array<UserStatsRow & { winRate: number | null }>
	paging: {
		limit: number
		offset: number
		total: number
	}
	filters: {
		query: string | null
		from: string | null
		to: string | null
		sortBy: FindUsersParams["sortBy"]
		sortOrder: FindUsersParams["sortOrder"]
	}
}

export async function listUsers(params: FindUsersParams): Promise<UserListResponse> {
	const { items, total } = await findUsers(params)

	return {
		items: items.map(serializeUserStats),
		paging: {
			limit: params.limit,
			offset: params.offset,
			total
		},
		filters: {
			query: params.query ?? null,
			from: params.from?.toISOString() ?? null,
			to: params.to?.toISOString() ?? null,
			sortBy: params.sortBy,
			sortOrder: params.sortOrder
		}
	}
}

export async function getUserProfile(
	playerId: number,
	params: Omit<FindUsersParams, "sortBy" | "query">
): Promise<{
	user: UserStatsRow & { winRate: number | null }
	matches: Awaited<ReturnType<typeof getMatches>>
} | null> {
	const user = await findUserById(playerId)

	if (!user) {
		return null
	}

	const [stats, matches] = await Promise.all([
		getUserStats(playerId, {
			from: params.from,
			to: params.to
		}),
		getMatches({
			limit: params.limit,
			offset: params.offset,
			from: params.from,
			to: params.to,
			playerId,
			sortOrder: params.sortOrder
		})
	])

	return {
		user: serializeUserStats({
			...stats,
			name: user.name
		}),
		matches
	}
}

export async function getLeaderboard(
	params: Omit<FindUsersParams, "sortBy" | "sortOrder" | "query">
): Promise<{
	items: Array<UserStatsRow & { winRate: number | null, rank: number }>
	filters: {
		from: string
		to: string
		fallbackApplied: boolean
	}
	paging: {
		limit: number
		offset: number
		total: number
	}
}> {
	const initialResult = await findLeaderboard(params)
	let result = initialResult
	let effectiveRange = {
		from: params.from,
		to: params.to
	}
	let fallbackApplied = false

	if (initialResult.total === 0) {
		const latestDay = await findLatestLeaderboardDay()

		if (latestDay) {
			effectiveRange = buildOneDayRange(latestDay)
			result = await findLeaderboard({
				...params,
				from: effectiveRange.from,
				to: effectiveRange.to
			})
			fallbackApplied = result.total > 0
		}
	}

	return {
		items: result.items.map((item, index) => ({
			...serializeUserStats(item),
			rank: params.offset + index + 1
		})),
		filters: {
			from: effectiveRange.from?.toISOString() ?? new Date().toISOString(),
			to: effectiveRange.to?.toISOString() ?? new Date().toISOString(),
			fallbackApplied
		},
		paging: {
			limit: params.limit,
			offset: params.offset,
			total: result.total
		}
	}
}

function serializeUserStats(user: UserStatsRow): UserStatsRow & { winRate: number | null } {
	return {
		...user,
		winRate: user.matches > 0 ? Number((user.wins / user.matches).toFixed(4)) : null
	}
}

export function buildDefaultLeaderboardRange(): Required<Omit<UserStatsFilters, "query">> {
	const from = new Date()
	from.setUTCHours(0, 0, 0, 0)

	return buildOneDayRange(from)
}

function buildOneDayRange(day: Date): Required<Omit<UserStatsFilters, "query">> {
	const from = new Date(day)
	from.setUTCHours(0, 0, 0, 0)

	return {
		from,
		to: new Date(from.getTime() + 24 * 60 * 60 * 1000)
	}
}
