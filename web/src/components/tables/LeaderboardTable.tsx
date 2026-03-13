import { Box, Skeleton, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, Typography, LinearProgress } from '@mui/material'
import type { LeaderboardItem } from '../../types'
import { UserProfileLink } from '../common/UserProfileLink'
import { ROWS_PER_PAGE_OPTIONS, type PaginationState } from './pagination'

type LeaderboardTableProps = {
  items: LeaderboardItem[]
  loading: boolean
  pagination: PaginationState
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  onNavigate: (path: string) => void
}

export function LeaderboardTable({
  items,
  loading,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onNavigate,
}: LeaderboardTableProps) {
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
            <TableCell>Rank</TableCell>
            <TableCell>User</TableCell>
            <TableCell align="right">Wins</TableCell>
            <TableCell align="right">Matches</TableCell>
            <TableCell align="right">Win rate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && items.length === 0
            ? Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={`leaderboard-skeleton-${index}`}>
                  <TableCell colSpan={5}>
                    <Skeleton variant="text" />
                  </TableCell>
                </TableRow>
              ))
            : null}
          {pagedItems.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.rank}</TableCell>
              <TableCell>
                <UserProfileLink id={row.id} name={row.name} onNavigate={onNavigate} />
              </TableCell>
              <TableCell align="right">{row.wins}</TableCell>
              <TableCell align="right">{row.matches}</TableCell>
              <TableCell align="right">{row.winRate === null ? '-' : `${(row.winRate * 100).toFixed(1)}%`}</TableCell>
            </TableRow>
          ))}
          {!loading && pagedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5}>
                <Typography color="text.secondary">No users found.</Typography>
              </TableCell>
            </TableRow>
          ) : null}
          {!loading && emptyRows > 0
            ? Array.from({ length: emptyRows }).map((_, index) => (
                <TableRow key={`leaderboard-empty-${index}`} sx={{ height: 53 }}>
                  <TableCell colSpan={5} />
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
