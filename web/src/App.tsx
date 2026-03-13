import { useCallback } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { LatestMatchesPage } from './pages/LatestMatchesPage'
import { MatchesPage } from './pages/MatchesPage'
import { UserPage } from './pages/UserPage'
import { resolveStaticRouteKey } from './routing'

function UserRoute({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { userId } = useParams<{ userId: string }>()
  const parsedUserId = Number(userId)

  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return <Navigate to="/latest" replace />
  }

  return <UserPage userId={parsedUserId} onNavigate={onNavigate} />
}

function App() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const activeStaticKey = resolveStaticRouteKey(pathname)

  const onNavigate = useCallback(
    (path: string) => {
      navigate(path)
    },
    [navigate],
  )

  return (
    <AppShell activeStaticKey={activeStaticKey} onNavigate={onNavigate}>
      <Routes>
        <Route path="/" element={<Navigate to="/latest" replace />} />
        <Route path="/latest" element={<LatestMatchesPage onNavigate={onNavigate} />} />
        <Route path="/matches" element={<MatchesPage onNavigate={onNavigate} />} />
        <Route path="/leaderboard" element={<LeaderboardPage onNavigate={onNavigate} />} />
        <Route path="/users/:userId" element={<UserRoute onNavigate={onNavigate} />} />
        <Route path="*" element={<Navigate to="/latest" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
