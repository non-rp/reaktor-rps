export function formatTimestamp(timestamp: string): string {
  const value = Number(timestamp)

  if (Number.isNaN(value)) {
    return timestamp
  }

  return new Date(value).toLocaleString()
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}
