import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LatestMatchesPage } from './LatestMatchesPage'
import { ApiError } from '../api/client'
import { getLatestMatches, refreshLatestMatches } from '../api/rpsApi'

vi.mock('../api/rpsApi', () => ({
  getLatestMatches: vi.fn(),
  refreshLatestMatches: vi.fn(),
}))

describe('LatestMatchesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads latest matches on mount', async () => {
    vi.mocked(getLatestMatches).mockResolvedValue({
      items: [
        {
          id: 1,
          gameId: 'game-1',
          time: '1710460800000',
          result: 'A',
          playerA: { id: 1, name: 'Alice' },
          playerB: { id: 2, name: 'Bob' },
        },
      ],
      paging: { limit: 25, offset: 0, total: 1 },
      cache: { total: 1, maxItems: 200 },
      sync: {
        isRunning: false,
        lastStartedAt: null,
        lastCompletedAt: null,
        lastEventAt: null,
        lastError: null,
        triggerSource: null,
        sessionMs: null,
        maxMatches: null,
      },
    })

    render(<LatestMatchesPage onNavigate={vi.fn()} />)

    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(getLatestMatches).toHaveBeenCalled()
  })

  it('starts refresh flow on button click', async () => {
    vi.mocked(getLatestMatches).mockResolvedValue({
      items: [],
      paging: { limit: 25, offset: 0, total: 0 },
      cache: { total: 0, maxItems: 200 },
      sync: {
        isRunning: false,
        lastStartedAt: null,
        lastCompletedAt: null,
        lastEventAt: null,
        lastError: null,
        triggerSource: null,
        sessionMs: null,
        maxMatches: null,
      },
    })
    vi.mocked(refreshLatestMatches).mockResolvedValue({
      status: 'started',
      items: [],
      paging: { limit: 25, offset: 0, total: 0 },
      cache: { total: 0, maxItems: 200 },
      sync: {
        isRunning: true,
        lastStartedAt: '2026-03-14T12:00:00.000Z',
        lastCompletedAt: null,
        lastEventAt: null,
        lastError: null,
        triggerSource: 'manual',
        sessionMs: 60000,
        maxMatches: 25,
      },
    })

    render(<LatestMatchesPage onNavigate={vi.fn()} />)
    fireEvent.click((await screen.findAllByRole('button', { name: 'Refresh' }))[0])

    await waitFor(() => {
      expect(refreshLatestMatches).toHaveBeenCalledWith(
        { limit: 25, offset: 0 },
        { sessionMs: 60000 },
      )
    })
    expect(screen.getByText(/Sync in progress/i)).toBeInTheDocument()
  })

  it('ignores 429 errors during silent polling', async () => {
    let pollCallback: (() => void) | undefined

    vi.spyOn(window, 'setInterval').mockImplementation((handler) => {
      pollCallback = () => {
        if (typeof handler === 'function') {
          handler()
        }
      }

      return 1
    })

    vi.spyOn(window, 'clearInterval').mockImplementation(() => {})

    vi.mocked(getLatestMatches)
      .mockResolvedValueOnce({
        items: [],
        paging: { limit: 25, offset: 0, total: 0 },
        cache: { total: 0, maxItems: 200 },
        sync: {
          isRunning: true,
          lastStartedAt: '2026-03-14T12:00:00.000Z',
          lastCompletedAt: null,
          lastEventAt: null,
          lastError: null,
          triggerSource: 'manual',
          sessionMs: 60000,
          maxMatches: 25,
        },
      })
      .mockRejectedValueOnce(new ApiError('Request failed: 429', 429, 1000))

    render(<LatestMatchesPage onNavigate={vi.fn()} />)

    await waitFor(() => {
      expect(getLatestMatches).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(pollCallback).toBeTypeOf('function')
    })

    await act(async () => {
      pollCallback?.()
      await Promise.resolve()
    })

    expect(getLatestMatches).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
