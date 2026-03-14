import { describe, expect, it, vi } from 'vitest'
import { formatTimestamp, todayIsoDate } from './format'

describe('formatTimestamp', () => {
  it('formats numeric timestamps as UTC strings', () => {
    expect(formatTimestamp('1710460800000')).toBe('03-15-2024 00:00:00 UTC')
  })

  it('returns original value for non-numeric timestamps', () => {
    expect(formatTimestamp('not-a-timestamp')).toBe('not-a-timestamp')
  })
})

describe('todayIsoDate', () => {
  it('returns current date in ISO format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-14T13:00:00.000Z'))

    expect(todayIsoDate()).toBe('2026-03-14')

    vi.useRealTimers()
  })
})
