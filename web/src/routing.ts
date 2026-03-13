export type StaticRouteKey = 'latest' | 'matches' | 'leaderboard'

export const routes: Record<StaticRouteKey, { path: string; label: string }> = {
  latest: { path: '/latest', label: 'Latest' },
  matches: { path: '/matches', label: 'Matches' },
  leaderboard: { path: '/leaderboard', label: 'Leaderboard' },
}

export function resolveStaticRouteKey(pathname: string): StaticRouteKey | null {
  return (Object.keys(routes) as StaticRouteKey[]).find((key) => routes[key].path === pathname) ?? null
}
