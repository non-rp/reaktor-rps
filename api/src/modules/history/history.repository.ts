import { prisma } from "../../db/prisma"

export type FindMatchesParams = {
	limit: number
	offset: number
}

export async function findMatches({
	limit,
	offset
}: FindMatchesParams) {
	const [matches, total] = await Promise.all([
		prisma.match.findMany({
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
		prisma.match.count()
	])

	return {
		matches,
		total
	}
}
