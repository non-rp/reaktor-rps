export type PlayerRef = {
  id: number
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
}

export type UserProfileResponse = {
  user: UserStats
  matches: MatchListResponse
}
