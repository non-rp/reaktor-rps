import { useEffect, useState } from 'react'
import { Alert, Button, Stack, TextField, Typography } from '@mui/material'
import { getMatches } from '../api/rpsApi'
import { PageCard } from '../components/common/PageCard'
import { MatchesTable } from '../components/tables/MatchesTable'
import { usePagination } from '../hooks/usePagination'
import type { Match } from '../types'
import { todayIsoDate } from '../utils/format'

type MatchesPageProps = {
  onNavigate: (path: string) => void
}

export function MatchesPage({ onNavigate }: MatchesPageProps) {
  const [day, setDay] = useState(todayIsoDate())
  const [playerName, setPlayerName] = useState('')
  const [filters, setFilters] = useState({ day: todayIsoDate(), playerName: '' })
  const [items, setItems] = useState<Match[]>([])
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
        const response = await getMatches({
          date: filters.day,
          playerName: filters.playerName,
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
  }, [filters.day, filters.playerName, pagination.page, pagination.rowsPerPage])

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
              const nextDay = event.target.value
              setDay(nextDay)
              setFilters((current) => ({ ...current, day: nextDay }))
              resetPage()
            }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Player name"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Amara Chen"
          />
          <Button
            variant="contained"
            onClick={() => {
              setFilters({ day, playerName })
              resetPage()
            }}
            disabled={loading}
          >
            Load
          </Button>
          <Button
            variant="text"
            onClick={() => {
              const today = todayIsoDate()
              setDay(today)
              setPlayerName('')
              setFilters({ day: today, playerName: '' })
              resetPage()
            }}
            disabled={loading}
          >
            Reset
          </Button>
        </Stack>
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
