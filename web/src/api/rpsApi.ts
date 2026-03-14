import { apiGet } from './client'
import type { LeaderboardResponse, MatchListResponse, UserProfileResponse } from '../types'

const FETCH_LIMIT = 500

type GetMatchesFilters = {
  date?: string
  playerName?: string
  playerId?: number
  limit?: number
  offset?: number
}

type GetLeaderboardFilters = {
  from: string
  to: string
  limit?: number
  offset?: number
}

export function getMatches(filters: GetMatchesFilters = {}) {
  return apiGet<MatchListResponse>('history', { limit: FETCH_LIMIT, offset: 0, ...filters })
}

export function getLatestMatches(filters: Pick<GetMatchesFilters, 'limit' | 'offset'> = {}) {
  return getMatches(filters)
}

export function getMatchesByDay(day: string) {
  return getMatches({ date: day })
}

export function getMatchesByPlayer(playerName: string) {
  return getMatches({ playerName })
}

export function getLeaderboard(filters: GetLeaderboardFilters) {
  return apiGet<LeaderboardResponse>('users/leaderboard', { limit: FETCH_LIMIT, offset: 0, ...filters })
}

export function getTodayLeaderboard(day: string) {
  return getLeaderboard({ from: day, to: day })
}

export function getHistoricalLeaderboard(from: string, to: string) {
  return getLeaderboard({ from, to })
}

export function getUserProfile(
  userId: number,
  filters: {
    from?: string
    to?: string
    limit?: number
    offset?: number
  } = {},
) {
  return apiGet<UserProfileResponse>(`users/${userId}`, { limit: FETCH_LIMIT, offset: 0, ...filters })
}
