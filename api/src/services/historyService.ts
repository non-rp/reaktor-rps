import { prisma } from "../db/prisma"

export async function getMatches() {

	const matches = await prisma.match.findMany({

		include: {
			playerA: true,
			playerB: true
		},

		orderBy: {
			time: "desc"
		}

	})

	return matches.map((match: Awaited<typeof matches>[number]) => ({
		...match,
		time: match.time.toString()
	}))

}
