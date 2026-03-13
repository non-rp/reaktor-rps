import { useCallback, useState } from 'react'
import { DEFAULT_ROWS_PER_PAGE, type PaginationState } from '../components/tables/pagination'

export function usePagination(initialRowsPerPage = DEFAULT_ROWS_PER_PAGE) {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    rowsPerPage: initialRowsPerPage,
  })

  const setPage = useCallback((page: number) => {
    setPagination((previous) => ({ ...previous, page }))
  }, [])

  const setRowsPerPage = useCallback((rowsPerPage: number) => {
    setPagination({
      page: 0,
      rowsPerPage,
    })
  }, [])

  const resetPage = useCallback(() => {
    setPagination((previous) => ({ ...previous, page: 0 }))
  }, [])

  return { pagination, setPage, setRowsPerPage, resetPage }
}
