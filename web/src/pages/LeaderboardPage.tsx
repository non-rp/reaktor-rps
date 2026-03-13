import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { getLeaderboard, getMatches } from '../api/rpsApi'
import { PageCard } from '../components/common/PageCard'
import { LeaderboardTable } from '../components/tables/LeaderboardTable'
import { usePagination } from '../hooks/usePagination'
import type { DateRangeResponse, LeaderboardItem } from '../types'
import { todayIsoDate } from '../utils/format'

type LeaderboardPageProps = {
  onNavigate: (path: string) => void
}

export function LeaderboardPage({ onNavigate }: LeaderboardPageProps) {
  const [fromDate, setFromDate] = useState(todayIsoDate())
  const [toDate, setToDate] = useState(todayIsoDate())
  const [items, setItems] = useState<LeaderboardItem[]>([])
  const [range, setRange] = useState<DateRangeResponse>({ from: null, to: null })
  const [loading, setLoading] = useState(true)
  const [rangeLoading, setRangeLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { pagination, setPage, setRowsPerPage, resetPage } = usePagination()
  const minDate = range.from
  const maxDate = range.to
  const hasRange = Boolean(minDate && maxDate)

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

  useEffect(() => {
    let cancelled = false

    const loadRange = async () => {
      try {
        const response = await getMatches()

        if (!cancelled) {
          setRange(response.range)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown error')
        }
      } finally {
        if (!cancelled) {
          setRangeLoading(false)
        }
      }
    }

    void loadRange()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!minDate || !maxDate) {
      return
    }

    setFromDate((current) => clampDate(current, minDate, maxDate))
    setToDate((current) => clampDate(current, minDate, maxDate))
  }, [minDate, maxDate])

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
              const next = event.target.value
              setFromDate(minDate && maxDate ? clampDate(next, minDate, maxDate) : next)
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: minDate ?? undefined, max: maxDate ?? undefined }}
            disabled={!hasRange}
          />
          <TextField
            type="date"
            label="To"
            value={toDate}
            onChange={(event) => {
              const next = event.target.value
              setToDate(minDate && maxDate ? clampDate(next, minDate, maxDate) : next)
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: minDate ?? undefined, max: maxDate ?? undefined }}
            disabled={!hasRange}
          />
          <Button variant="contained" onClick={() => void load()} disabled={loading || rangeLoading || !fromDate || !toDate || !hasRange}>
            Load
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const today = todayIsoDate()
              const target = minDate && maxDate ? clampDate(today, minDate, maxDate) : today
              setFromDate(target)
              setToDate(target)
            }}
            disabled={loading || rangeLoading || !hasRange}
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

function clampDate(value: string, min: string, max: string): string {
  if (!value || value < min) {
    return min
  }

  if (value > max) {
    return max
  }

  return value
}
