import { Box, Skeleton, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, Typography, LinearProgress } from '@mui/material'
import type { Match } from '../../types'
import { formatTimestamp } from '../../utils/format'
import { UserProfileLink } from '../common/UserProfileLink'
import { ROWS_PER_PAGE_OPTIONS, type PaginationState } from './pagination'

type MatchesTableProps = {
  items: Match[]
  loading: boolean
  pagination: PaginationState
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  onNavigate: (path: string) => void
}

export function MatchesTable({
  items,
  loading,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onNavigate,
}: MatchesTableProps) {
  const { page, rowsPerPage } = pagination
  const startIndex = page * rowsPerPage
  const pagedItems = items.slice(startIndex, startIndex + rowsPerPage)
  const emptyRows = Math.max(rowsPerPage - pagedItems.length, 0)

  return (
    <Box sx={{ position: 'relative', minHeight: 520 }}>
      {loading ? <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} /> : null}
      <Table size="small" sx={{ opacity: loading ? 0.75 : 1 }}>
        <TableHead>
          <TableRow>
            <TableCell>Time (UTC)</TableCell>
            <TableCell>Player A</TableCell>
            <TableCell>Player B</TableCell>
            <TableCell>Result</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && items.length === 0
            ? Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={`match-skeleton-${index}`}>
                  <TableCell colSpan={4}>
                    <Skeleton variant="text" />
                  </TableCell>
                </TableRow>
              ))
            : null}
          {pagedItems.map((match) => (
            <TableRow key={match.id}>
              <TableCell>{formatTimestamp(match.time)}</TableCell>
              <TableCell>
                <UserProfileLink id={match.playerA.id} name={match.playerA.name} onNavigate={onNavigate} />
              </TableCell>
              <TableCell>
                <UserProfileLink id={match.playerB.id} name={match.playerB.name} onNavigate={onNavigate} />
              </TableCell>
              <TableCell>{match.result == "DRAW" ? "TIE" : match.result}</TableCell>
            </TableRow>
          ))}
          {!loading && pagedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography color="text.secondary">No matches found.</Typography>
              </TableCell>
            </TableRow>
          ) : null}
          {!loading && emptyRows > 0
            ? Array.from({ length: emptyRows }).map((_, index) => (
                <TableRow key={`match-empty-${index}`} sx={{ height: 53 }}>
                  <TableCell colSpan={4} />
                </TableRow>
              ))
            : null}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={items.length}
        page={page}
        onPageChange={(_, nextPage) => onPageChange(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => onRowsPerPageChange(Number(event.target.value))}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      />
    </Box>
  )
}
