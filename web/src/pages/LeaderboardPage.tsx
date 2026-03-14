import { useEffect, useState } from 'react'
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
  const [filters, setFilters] = useState({ from: todayIsoDate(), to: todayIsoDate() })
  const [items, setItems] = useState<LeaderboardItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { pagination, setPage, setRowsPerPage, resetPage } = usePagination()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await getLeaderboard({
          from: filters.from,
          to: filters.to,
          limit: pagination.rowsPerPage,
          offset: pagination.page * pagination.rowsPerPage,
        })

        if (cancelled) {
          return
        }

        setItems(response.items)
        setTotalCount(response.paging.total)
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

    void load()

    return () => {
      cancelled = true
    }
  }, [filters.from, filters.to, pagination.page, pagination.rowsPerPage])

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Leaderboard</Typography>
      <PageCard title="Date Range">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            type="date"
            label="From"
            value={fromDate}
            onChange={(event) => {
              const nextFrom = event.target.value
              setFromDate(nextFrom)
              setFilters((current) => ({ ...current, from: nextFrom }))
              resetPage()
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="date"
            label="To"
            value={toDate}
            onChange={(event) => {
              const nextTo = event.target.value
              setToDate(nextTo)
              setFilters((current) => ({ ...current, to: nextTo }))
              resetPage()
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setFilters({ from: fromDate, to: toDate })
              resetPage()
            }}
            disabled={loading || !fromDate || !toDate}
          >
            Load
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const today = todayIsoDate()
              setFromDate(today)
              setToDate(today)
              setFilters({ from: today, to: today })
              resetPage()
            }}
            disabled={loading}
          >
            Today
          </Button>
        </Stack>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <LeaderboardTable
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
