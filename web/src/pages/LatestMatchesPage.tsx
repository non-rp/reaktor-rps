import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Stack, Typography } from '@mui/material'
import { getLatestMatches } from '../api/rpsApi'
import { PageCard } from '../components/common/PageCard'
import { MatchesTable } from '../components/tables/MatchesTable'
import { usePagination } from '../hooks/usePagination'
import type { Match } from '../types'

type LatestMatchesPageProps = {
  onNavigate: (path: string) => void
}

export function LatestMatchesPage({ onNavigate }: LatestMatchesPageProps) {
  const [items, setItems] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { pagination, setPage, setRowsPerPage, resetPage } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getLatestMatches()
      setItems(response.items)
      resetPage()
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [resetPage])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Latest RPS Match Results</Typography>
      <PageCard title="Latest Matches">
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => void load()} disabled={loading}>
            Refresh
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
