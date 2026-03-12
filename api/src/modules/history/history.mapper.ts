type MatchWithPlayers = {
	id: number
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
	result: string
	winnerId: number | null
	createdAt: Date
	playerA: {
		id: number
		name: string
	}
	playerB: {
		id: number
		name: string
	}
}

export function serializeMatch(match: MatchWithPlayers) {
	return {
		...match,
		time: match.time.toString()
	}
}
