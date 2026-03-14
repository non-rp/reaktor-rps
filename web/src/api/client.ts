type QueryParams = Record<string, string | number | null | undefined>

export class ApiError extends Error {
  status: number
  retryAfterMs: number | null

  constructor(message: string, status: number, retryAfterMs: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api'

function buildUrl(path: string, query?: QueryParams): string {
  const normalizedBase = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`
  const url = new URL(path, normalizedBase)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

export async function apiGet<T>(path: string, query?: QueryParams): Promise<T> {
  const response = await fetch(buildUrl(path, query))

  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.status}`,
      response.status,
      getRetryAfterMs(response),
    )
  }

  return (await response.json()) as T
}

export async function apiPost<T>(
  path: string,
  body?: Record<string, unknown>,
  query?: QueryParams,
): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new ApiError(
      `Request failed: ${response.status}`,
      response.status,
      getRetryAfterMs(response),
    )
  }

  return (await response.json()) as T
}

function getRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get('Retry-After')

  if (!retryAfter) {
    return null
  }

  const retryAfterSeconds = Number(retryAfter)

  if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) {
    return null
  }

  return retryAfterSeconds * 1000
}
