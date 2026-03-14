import { useCallback, useEffect, useState } from 'react'
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
  const [items, setItems] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { pagination, setPage, setRowsPerPage, resetPage } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getMatches({ date: day, playerName })
      setItems(response.items)
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

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Matches</Typography>
      <PageCard title="Filters">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            type="date"
            label="Day"
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
          <TextField
            label="Player name"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Amara Chen"
          />
          <Button variant="contained" onClick={() => void load()} disabled={loading}>
            Load
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setDay(todayIsoDate())
              setPlayerName('')
            }}
            disabled={loading}
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
