export type PlayerRef = {
  id: number | null
  name: string
}

export type Match = {
  id: number
  gameId: string
  time: string
  result: string
  playerA: PlayerRef
  playerB: PlayerRef
}

export type Paging = {
  limit: number
  offset: number
  total: number
}

export type MatchListResponse = {
  items: Match[]
  paging: Paging
  range: DateRangeResponse
  filters?: {
    from: string | null
    to: string | null
    playerId: number | null
    playerName: string | null
    sortOrder: 'asc' | 'desc'
  }
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
  items: Match[]
  paging: Paging
  cache: {
    total: number
    maxItems: number
  }
  sync: LiveStreamSyncState
}

export type DateRangeResponse = {
  from: string | null
  to: string | null
}

export type UserStats = {
  id: number
  name: string
  matches: number
  wins: number
  losses: number
  draws: number
  invalidMatches: number
  winRate: number | null
}

export type LeaderboardItem = UserStats & {
  rank: number
}

export type LeaderboardResponse = {
  items: LeaderboardItem[]
  paging: Paging
  filters: {
    from: string
    to: string
    fallbackApplied: boolean
  }
}

export type UserProfileResponse = {
  user: UserStats
  matches: MatchListResponse
}
