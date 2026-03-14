export function formatTimestamp(timestamp: string): string {
  const value = Number(timestamp)

  if (Number.isNaN(value)) {
    return timestamp
  }

  const date = new Date(value)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${month}-${day}-${year} ${hours}:${minutes}:${seconds} UTC`
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}
