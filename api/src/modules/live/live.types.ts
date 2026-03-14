export type LivePlayerRef = {
	id: number | null
	name: string
}

export type LiveMatch = {
	id: number
	gameId: string
	time: string
	result: "A" | "B" | "DRAW" | "INVALID"
	playerA: LivePlayerRef
	playerB: LivePlayerRef
	playerAMove: string
	playerBMove: string
	playerAMoveValid: boolean
	playerBMoveValid: boolean
	isValid: boolean
	invalidReason: string | null
	receivedAt: string
}

export type LiveStreamSyncState = {
	isRunning: boolean
	lastStartedAt: string | null
	lastCompletedAt: string | null
	lastEventAt: string | null
	lastError: string | null
	triggerSource: string | null
	sessionMs: number | null
	maxMatches: number | null
}

export type LiveStreamResponse = {
	items: LiveMatch[]
	paging: {
		limit: number
		offset: number
		total: number
	}
	cache: {
		total: number
		maxItems: number
	}
	sync: LiveStreamSyncState
}
