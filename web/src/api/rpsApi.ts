import { apiGet } from './client'
import type { LeaderboardResponse, MatchListResponse, UserProfileResponse } from '../types'

const FETCH_LIMIT = 500

type GetMatchesFilters = {
  date?: string
  playerName?: string
}

type GetLeaderboardFilters = {
  from: string
  to: string
}

export function getMatches(filters: GetMatchesFilters = {}) {
  return apiGet<MatchListResponse>('history', { ...filters, limit: FETCH_LIMIT })
}

export function getLatestMatches() {
  return getMatches()
}

export function getMatchesByDay(day: string) {
  return getMatches({ date: day })
}

export function getMatchesByPlayer(playerName: string) {
  return getMatches({ playerName })
}

export function getLeaderboard(filters: GetLeaderboardFilters) {
  return apiGet<LeaderboardResponse>('users/leaderboard', { ...filters, limit: FETCH_LIMIT })
}

export function getTodayLeaderboard(day: string) {
  return getLeaderboard({ from: day, to: day })
}

export function getHistoricalLeaderboard(from: string, to: string) {
  return getLeaderboard({ from, to })
}

export function getUserProfile(userId: number) {
  return apiGet<UserProfileResponse>(`users/${userId}`, { limit: FETCH_LIMIT })
}
