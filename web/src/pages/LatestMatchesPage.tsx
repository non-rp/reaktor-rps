import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { ApiError } from '../api/client'
import { getLatestMatches, refreshLatestMatches } from '../api/rpsApi'
import { PageCard } from '../components/common/PageCard'
import { MatchesTable } from '../components/tables/MatchesTable'
import { usePagination } from '../hooks/usePagination'
import type { LiveStreamSyncState, Match } from '../types'

type LatestMatchesPageProps = {
  onNavigate: (path: string) => void
}

const LIVE_POLL_INTERVAL_MS = 1100

export function LatestMatchesPage({ onNavigate }: LatestMatchesPageProps) {
  const [items, setItems] = useState<Match[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sync, setSync] = useState<LiveStreamSyncState | null>(null)
  const { pagination, setPage, setRowsPerPage } = usePagination()

  const load = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setLoading(true)
    }

    try {
      const response = await getLatestMatches({
        limit: pagination.rowsPerPage,
        offset: pagination.page * pagination.rowsPerPage,
      })
      setError(null)
      setItems(response.items)
      setTotalCount(response.paging.total)
      setSync(response.sync)
    } catch (loadError) {
      if (options.silent && loadError instanceof ApiError && loadError.status === 429) {
        return
      }

      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
    } finally {
      if (!options.silent) {
        setLoading(false)
      }
    }
  }, [pagination.page, pagination.rowsPerPage])

  const refresh = useCallback(async () => {
    setLoading(items.length === 0)
    setIsRefreshing(true)
    setError(null)

    try {
      const response = await refreshLatestMatches(
        {
          limit: pagination.rowsPerPage,
          offset: pagination.page * pagination.rowsPerPage,
        },
        {
          sessionMs: 60000,
        },
      )

      setItems(response.items)
      setTotalCount(response.paging.total)
      setSync(response.sync)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
      setIsRefreshing(false)
      setLoading(false)
    }
  }, [items.length, pagination.page, pagination.rowsPerPage])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!sync?.isRunning) {
      setIsRefreshing(false)
      setLoading(false)
      return
    }

    const timer = window.setInterval(() => {
      void load({ silent: true })
    }, LIVE_POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [load, sync?.isRunning])

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Latest RPS Match Results</Typography>
      <PageCard title="Latest Matches">
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => void refresh()} disabled={loading || isRefreshing}>
            Refresh
          </Button>
        </Stack>
        {sync?.isRunning ? (
          <Typography variant="body2" color="text.secondary">
            Sync in progress. Cache is updating live while the API reads matches.
          </Typography>
        ) : null}
        {sync?.lastCompletedAt ? (
          <Typography variant="body2" color="text.secondary">
            Cache updated at {new Date(sync.lastCompletedAt).toUTCString()}
          </Typography>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        <MatchesTable
          items={items}
          totalCount={totalCount}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onNavigate={onNavigate}
        />
      </PageCard>
    </Stack>
  )
}
