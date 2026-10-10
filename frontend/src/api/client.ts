/**
 * Thin fetch wrapper around the FastAPI backend.
 *
 * - Attaches the access token as a Bearer header.
 * - On a 401, exchanges the refresh token for a new pair and retries once.
 *   The backend rotates refresh tokens and treats reuse of an old one as
 *   theft (revoking every session), so concurrent 401s must share a single
 *   refresh call; `refreshInFlight` guarantees that.
 * - If refreshing fails, tokens are cleared and `onSessionExpired` listeners
 *   fire so the app can send the user back to the login page.
 */
import type { TokenResponse } from './types'

const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

const ACCESS_KEY = 'wt.access_token'
const REFRESH_KEY = 'wt.refresh_token'

// --- Token storage ------------------------------------------------------------

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage unavailable (private mode): the session just won't survive a reload.
  }
}

export const tokens = {
  get access() {
    return read(ACCESS_KEY)
  },
  get refresh() {
    return read(REFRESH_KEY)
  },
  set(pair: Pick<TokenResponse, 'access_token' | 'refresh_token'>) {
    write(ACCESS_KEY, pair.access_token)
    write(REFRESH_KEY, pair.refresh_token)
  },
  clear() {
    write(ACCESS_KEY, null)
    write(REFRESH_KEY, null)
  },
}

const sessionExpiredListeners = new Set<() => void>()

export function onSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

// --- Errors -------------------------------------------------------------------

interface ValidationIssue {
  loc?: (string | number)[]
  msg: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function messageFromBody(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    // FastAPI 422: [{loc: ["body", "exercises", 0, "sets", 1, "reps"], msg: "..."}]
    return (detail as ValidationIssue[])
      .map((issue) => {
        const field = issue.loc?.filter((part) => part !== 'body').join(' › ')
        return field ? `${field}: ${issue.msg}` : issue.msg
      })
      .join('\n')
  }
  return `Request failed (${status})`
}

// --- Requests -----------------------------------------------------------------

let refreshInFlight: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokens.refresh
  if (!refreshToken) return false
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) {
      // Another tab may have rotated the token while we were waiting; only
      // treat this as a failure if our token is still the stored one.
      return tokens.refresh !== refreshToken
    }
    tokens.set((await res.json()) as TokenResponse)
    return true
  } catch {
    return false
  }
}

function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= refreshTokens().finally(() => {
    refreshInFlight = null
  })
  return refreshInFlight
}

type Query = Record<string, string | number | null | undefined>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Query
  /** Skip the Authorization header and the refresh-on-401 flow. */
  anonymous?: boolean
}

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, anonymous = false } = options

  const send = (accessToken: string | null) =>
    fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken && !anonymous ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

  const usedToken = tokens.access
  let res = await send(usedToken)

  if (res.status === 401 && !anonymous) {
    // If another request already refreshed, just retry with the new token.
    const refreshed = tokens.access !== usedToken || (await refreshOnce())
    if (refreshed) {
      res = await send(tokens.access)
    }
    if (res.status === 401) {
      tokens.clear()
      sessionExpiredListeners.forEach((listener) => listener())
    }
  }

  if (res.status === 204) return undefined as T

  const data: unknown = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, messageFromBody(res.status, data))
  return data as T
}
