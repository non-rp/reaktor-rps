import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiGet, apiPost } from './client'

describe('api client', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds query string for GET requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await apiGet('history', { limit: 25, playerName: 'Alice', empty: '' })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/history?limit=25&playerName=Alice',
    )
  })

  it('sends JSON body for POST requests', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'started' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await apiPost('live/stream', { sessionMs: 60000 }, { limit: 25 })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/live/stream?limit=25',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ sessionMs: 60000 }),
      }),
    )
  })

  it('throws ApiError with retryAfterMs for failed requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: { 'Retry-After': '2' },
      }),
    )

    await expect(apiGet('history')).rejects.toEqual(
      new ApiError('Request failed: 429', 429, 2000),
    )
  })
})
