import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { getMatches } from '../api/rpsApi'
import { PageCard } from '../components/common/PageCard'
import { MatchesTable } from '../components/tables/MatchesTable'
import { usePagination } from '../hooks/usePagination'
import type { DateRangeResponse, Match } from '../types'
import { todayIsoDate } from '../utils/format'

type MatchesPageProps = {
  onNavigate: (path: string) => void
}

export function MatchesPage({ onNavigate }: MatchesPageProps) {
  const [day, setDay] = useState(todayIsoDate())
  const [playerName, setPlayerName] = useState('')
  const [items, setItems] = useState<Match[]>([])
  const [range, setRange] = useState<DateRangeResponse>({ from: null, to: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { pagination, setPage, setRowsPerPage, resetPage } = usePagination()
  const minDate = range.from
  const maxDate = range.to
  const hasRange = Boolean(minDate && maxDate)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getMatches({ date: day, playerName })
      setItems(response.items)
      setRange(response.range)
      resetPage()
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [day, playerName, resetPage])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!minDate || !maxDate) {
      return
    }

    setDay((current) => clampDate(current, minDate, maxDate))
  }, [minDate, maxDate])

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Matches</Typography>
      <PageCard title="Filters">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            type="date"
            label="Day"
            value={day}
            onChange={(event) => {
              const next = event.target.value
              setDay(minDate && maxDate ? clampDate(next, minDate, maxDate) : next)
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: minDate ?? undefined, max: maxDate ?? undefined }}
            disabled={!hasRange}
          />
          <TextField
            label="Player name"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="alice"
          />
          <Button variant="contained" onClick={() => void load()} disabled={loading || !hasRange}>
            Load
          </Button>
          <Button
            variant="text"
            onClick={() => {
              const today = todayIsoDate()
              setDay(minDate && maxDate ? clampDate(today, minDate, maxDate) : today)
              setPlayerName('')
            }}
            disabled={loading || !hasRange}
          >
            Reset
          </Button>
        </Stack>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <MatchesTable
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
