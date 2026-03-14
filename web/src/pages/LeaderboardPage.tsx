import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { getLeaderboard } from '../api/rpsApi'
import { PageCard } from '../components/common/PageCard'
import { LeaderboardTable } from '../components/tables/LeaderboardTable'
import { usePagination } from '../hooks/usePagination'
import type { LeaderboardItem } from '../types'
import { todayIsoDate } from '../utils/format'

type LeaderboardPageProps = {
  onNavigate: (path: string) => void
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps) {
  const [fromDate, setFromDate] = useState(todayIsoDate())
  const [toDate, setToDate] = useState(todayIsoDate())
  const [items, setItems] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { pagination, setPage, setRowsPerPage, resetPage } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getLeaderboard({ from: fromDate, to: toDate })
      setItems(response.items)
      resetPage()
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate, resetPage])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Leaderboard</Typography>
      <PageCard title="Date Range">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            type="date"
            label="From"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <TextField
            type="date"
            label="To"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
          <Button variant="contained" onClick={() => void load()} disabled={loading || !fromDate || !toDate}>
            Load
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const today = todayIsoDate()
              setFromDate(today)
              setToDate(today)
            }}
            disabled={loading}
          >
            Today
          </Button>
        </Stack>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <LeaderboardTable
          items={items}
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
