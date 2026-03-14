import { useEffect, useState } from 'react'
import { Alert, Card, CardContent, LinearProgress, Link, Stack, Typography } from '@mui/material'
import { getUserProfile } from '../api/rpsApi'
import { PageCard } from '../components/common/PageCard'
import { MatchesTable } from '../components/tables/MatchesTable'
import { usePagination } from '../hooks/usePagination'
import type { UserProfileResponse } from '../types'

type UserPageProps = {
  userId: number
  onNavigate: (path: string) => void
}

export function UserPage({ userId, onNavigate }: UserPageProps) {
  const [data, setData] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { pagination, setPage, setRowsPerPage } = usePagination()

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      setLoading(true)
      setError(null)
      try {
        const response = await getUserProfile(userId, {
          limit: pagination.rowsPerPage,
          offset: pagination.page * pagination.rowsPerPage,
        })

        if (!cancelled) {
          setData(response)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadUser()

    return () => {
      cancelled = true
    }
  }, [pagination.page, pagination.rowsPerPage, userId])

  return (
    <Stack spacing={2}>
      <Link
        href="/latest"
        onClick={(event) => {
          event.preventDefault()
          onNavigate('/latest')
        }}
        underline="hover"
      >
        Back to pages
      </Link>

      {loading && !data ? <LinearProgress /> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}

      {data ? (
        <>
          <Typography variant="h4">{data.user.name}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Card sx={{ minWidth: 140 }}>
              <CardContent>
                <Typography variant="caption">Wins</Typography>
                <Typography variant="h6">{data.user.wins}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 140 }}>
              <CardContent>
                <Typography variant="caption">Matches</Typography>
                <Typography variant="h6">{data.user.matches}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 140 }}>
              <CardContent>
                <Typography variant="caption">Win Rate</Typography>
                <Typography variant="h6">
                  {data.user.winRate === null ? '-' : `${(data.user.winRate * 100).toFixed(1)}%`}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
          <PageCard title="User Match History">
            <MatchesTable
              items={data.matches.items}
              totalCount={data.matches.paging.total}
              loading={loading}
              pagination={pagination}
              onPageChange={setPage}
              onRowsPerPageChange={setRowsPerPage}
              onNavigate={onNavigate}
            />
          </PageCard>
        </>
      ) : null}
    </Stack>
  )
}
