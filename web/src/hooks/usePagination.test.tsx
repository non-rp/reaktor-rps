import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('uses provided initial rows per page', () => {
    const { result } = renderHook(() => usePagination(50))

    expect(result.current.pagination).toEqual({
      page: 0,
      rowsPerPage: 50,
    })
  })

  it('updates page and resets it when page size changes', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.pagination.page).toBe(2)

    act(() => {
      result.current.setRowsPerPage(100)
    })

    expect(result.current.pagination).toEqual({
      page: 0,
      rowsPerPage: 100,
    })
  })

  it('resets page to zero on demand', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.setPage(3)
      result.current.resetPage()
    })

    expect(result.current.pagination.page).toBe(0)
  })
})
