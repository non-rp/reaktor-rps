import { prisma } from "../../db/prisma"
import { Prisma } from "@prisma/client"

export type FindMatchesParams = {
	limit: number
	offset: number
	from?: Date
	to?: Date
	playerId?: number
	playerName?: string
}

export async function findMatches({
	limit,
	offset,
	from,
	to,
	playerId,
	playerName
}: FindMatchesParams) {
	const where = buildMatchWhere({
		from,
		to,
		playerId,
		playerName
	})

	const [matches, total] = await Promise.all([
		prisma.match.findMany({
			where,
			include: {
				playerA: true,
				playerB: true
			},
			orderBy: {
				time: "desc"
			},
			take: limit,
			skip: offset
		}),
		prisma.match.count({
			where
		})
	])

	return {
		matches,
		total
	}
}

function buildMatchWhere({
	from,
	to,
	playerId,
	playerName
}: Omit<FindMatchesParams, "limit" | "offset">): Prisma.MatchWhereInput {
	const and: Prisma.MatchWhereInput[] = []

	if (from || to) {
		and.push({
			time: {
				...(from ? { gte: BigInt(from.getTime()) } : {}),
				...(to ? { lt: BigInt(to.getTime()) } : {})
			}
		})
	}

	if (typeof playerId === "number") {
		and.push({
			OR: [
				{ playerAId: playerId },
				{ playerBId: playerId }
			]
		})
	}

	if (playerName) {
		and.push({
			OR: [
				{
					playerA: {
						name: {
							contains: playerName,
							mode: "insensitive"
						}
					}
				},
				{
					playerB: {
						name: {
							contains: playerName,
							mode: "insensitive"
						}
					}
				}
			]
		})
	}

	if (and.length === 0) {
		return {}
	}

	return { AND: and }
}
