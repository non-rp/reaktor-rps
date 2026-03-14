import { Prisma } from "@prisma/client"
import { prisma } from "../../db/prisma"

export type UserStatsFilters = {
	from?: Date
	to?: Date
	query?: string
}

export type FindUsersParams = UserStatsFilters & {
	limit: number
	offset: number
	sortBy: "name" | "wins" | "matches" | "losses" | "draws"
	sortOrder: "asc" | "desc"
}

export type UserStatsRow = {
	id: number
	name: string
	matches: number
	wins: number
	losses: number
	draws: number
	invalidMatches: number
}

export async function findUsers(params: FindUsersParams): Promise<{
	items: UserStatsRow[]
	total: number
}> {
	const where = buildPlayerWhere(params.query)
	const statsCte = buildStatsCte(params.from, params.to)
	const orderBy = buildUsersOrderBy(params.sortBy, params.sortOrder)

	const [items, total] = await Promise.all([
		prisma.$queryRaw<UserStatsRow[]>(Prisma.sql`
			${statsCte}
			SELECT
				p."id",
				p."name",
				COALESCE(stats."matches", 0)::INTEGER AS "matches",
				COALESCE(stats."wins", 0)::INTEGER AS "wins",
				COALESCE(stats."losses", 0)::INTEGER AS "losses",
				COALESCE(stats."draws", 0)::INTEGER AS "draws",
				COALESCE(stats."invalidMatches", 0)::INTEGER AS "invalidMatches"
			FROM "Player" p
			LEFT JOIN stats ON stats."playerId" = p."id"
			${where}
			${orderBy}
			LIMIT ${params.limit}
			OFFSET ${params.offset}
		`),
		prisma.player.count({
			where: params.query
				? {
					name: {
						contains: params.query,
						mode: "insensitive"
					}
				}
				: undefined
		})
	])

	return {
		items,
		total
	}
}

export async function findUserById(id: number): Promise<{ id: number, name: string } | null> {
	return prisma.player.findUnique({
		where: { id },
		select: {
			id: true,
			name: true
		}
	})
}

export async function getUserStats(
	playerId: number,
	filters: Omit<UserStatsFilters, "query">
): Promise<UserStatsRow> {
	const statsCte = buildStatsCte(filters.from, filters.to)
	const [userStats] = await prisma.$queryRaw<UserStatsRow[]>(Prisma.sql`
		${statsCte}
		SELECT
			p."id",
			p."name",
			COALESCE(stats."matches", 0)::INTEGER AS "matches",
			COALESCE(stats."wins", 0)::INTEGER AS "wins",
			COALESCE(stats."losses", 0)::INTEGER AS "losses",
			COALESCE(stats."draws", 0)::INTEGER AS "draws",
			COALESCE(stats."invalidMatches", 0)::INTEGER AS "invalidMatches"
		FROM "Player" p
		LEFT JOIN stats ON stats."playerId" = p."id"
		WHERE p."id" = ${playerId}
	`)

	return userStats
}

export async function findLeaderboard(params: Omit<FindUsersParams, "sortBy" | "sortOrder" | "query">): Promise<{
	items: UserStatsRow[]
	total: number
}> {
	const statsCte = buildStatsCte(params.from, params.to)

	const [items, [countRow]] = await Promise.all([
		prisma.$queryRaw<UserStatsRow[]>(Prisma.sql`
			${statsCte}
			SELECT
				p."id",
				p."name",
				stats."matches"::INTEGER AS "matches",
				stats."wins"::INTEGER AS "wins",
				stats."losses"::INTEGER AS "losses",
				stats."draws"::INTEGER AS "draws",
				stats."invalidMatches"::INTEGER AS "invalidMatches"
			FROM stats
			INNER JOIN "Player" p ON p."id" = stats."playerId"
			WHERE stats."matches" > 0
			ORDER BY stats."wins" DESC, stats."matches" DESC, p."name" ASC
			LIMIT ${params.limit}
			OFFSET ${params.offset}
		`),
		prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
			${statsCte}
			SELECT COUNT(*)::BIGINT AS "total"
			FROM stats
			WHERE stats."matches" > 0
		`)
	])

	return {
		items,
		total: Number(countRow?.total ?? 0n)
	}
}

function buildPlayerWhere(query?: string): Prisma.Sql {
	if (!query) {
		return Prisma.empty
	}

	return Prisma.sql`WHERE p."name" ILIKE ${`%${query}%`}`
}

function buildUsersOrderBy(
	sortBy: FindUsersParams["sortBy"],
	sortOrder: FindUsersParams["sortOrder"]
): Prisma.Sql {
	const direction = sortOrder === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`

	switch (sortBy) {
		case "wins":
			return Prisma.sql`ORDER BY "wins" ${direction}, p."name" ASC`
		case "matches":
			return Prisma.sql`ORDER BY "matches" ${direction}, p."name" ASC`
		case "losses":
			return Prisma.sql`ORDER BY "losses" ${direction}, p."name" ASC`
		case "draws":
			return Prisma.sql`ORDER BY "draws" ${direction}, p."name" ASC`
		case "name":
		default:
			return Prisma.sql`ORDER BY p."name" ${direction}`
	}
}

function buildStatsCte(from?: Date, to?: Date): Prisma.Sql {
	const dateFilter = buildDateFilter(from, to)

	return Prisma.sql`
		WITH stats AS (
			SELECT
				"playerId",
				COALESCE(SUM("matches"), 0)::INTEGER AS "matches",
				COALESCE(SUM("wins"), 0)::INTEGER AS "wins",
				COALESCE(SUM("losses"), 0)::INTEGER AS "losses",
				COALESCE(SUM("draws"), 0)::INTEGER AS "draws",
				COALESCE(SUM("invalidMatches"), 0)::INTEGER AS "invalidMatches"
			FROM "PlayerDayStat"
			${dateFilter}
			GROUP BY "playerId"
		)
	`
}

function buildDateFilter(from?: Date, to?: Date): Prisma.Sql {
	const conditions: Prisma.Sql[] = []

	if (from) {
		conditions.push(Prisma.sql`"day" >= ${from}::date`)
	}

	if (to) {
		conditions.push(Prisma.sql`"day" < ${to}::date`)
	}

	if (conditions.length === 0) {
		return Prisma.empty
	}

	return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
}
