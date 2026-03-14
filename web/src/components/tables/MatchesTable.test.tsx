import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MatchesTable } from './MatchesTable'

describe('MatchesTable', () => {
  it('renders rows and formats draw as TIE', () => {
    render(
      <MatchesTable
        items={[
          {
            id: 1,
            gameId: 'game-1',
            time: '1710460800000',
            result: 'DRAW',
            playerA: { id: 10, name: 'Alice' },
            playerB: { id: null, name: 'Bob' },
          },
        ]}
        totalCount={1}
        loading={false}
        pagination={{ page: 0, rowsPerPage: 25 }}
        onPageChange={vi.fn()}
        onRowsPerPageChange={vi.fn()}
        onNavigate={vi.fn()}
      />,
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('TIE')).toBeInTheDocument()
  })

  it('shows empty state when there are no matches', () => {
    render(
      <MatchesTable
        items={[]}
        totalCount={0}
        loading={false}
        pagination={{ page: 0, rowsPerPage: 25 }}
        onPageChange={vi.fn()}
        onRowsPerPageChange={vi.fn()}
        onNavigate={vi.fn()}
      />,
    )

    expect(screen.getByText('No matches found.')).toBeInTheDocument()
  })

  it('shows loading skeleton rows before data arrives', () => {
    render(
      <MatchesTable
        items={[]}
        totalCount={0}
        loading
        pagination={{ page: 0, rowsPerPage: 25 }}
        onPageChange={vi.fn()}
        onRowsPerPageChange={vi.fn()}
        onNavigate={vi.fn()}
      />,
    )

    expect(screen.getAllByText((_, element) => element?.tagName.toLowerCase() === 'span').length).toBeGreaterThan(0)
  })

  it('forwards pagination changes', () => {
    const onPageChange = vi.fn()

    render(
      <MatchesTable
        items={[]}
        totalCount={30}
        loading={false}
        pagination={{ page: 0, rowsPerPage: 25 }}
        onPageChange={onPageChange}
        onRowsPerPageChange={vi.fn()}
        onNavigate={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByLabelText('Go to next page'))

    expect(onPageChange).toHaveBeenCalledWith(1)
  })
})
