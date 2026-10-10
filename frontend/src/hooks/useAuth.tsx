import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { api, onSessionExpired, tokens } from '../api/client'
import type { TokenResponse, User } from '../api/types'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface SignupInput {
  email: string
  password: string
  display_name?: string
}

interface AuthContextValue {
  user: User | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(tokens.access ? 'loading' : 'anonymous')

  const loadUser = useCallback(async () => {
    const me = await api<User>('/auth/me')
    setUser(me)
    setStatus('authenticated')
  }, [])

  const reset = useCallback(() => {
    tokens.clear()
    setUser(null)
    setStatus('anonymous')
    queryClient.clear()
  }, [queryClient])

  // Restore the session from stored tokens on first load. State is only set
  // after the /auth/me request resolves, so this is a genuine external sync.
  useEffect(() => {
    if (!tokens.access) return
    // oxlint-disable-next-line react/set-state-in-effect
    loadUser().catch(reset)
  }, [loadUser, reset])

  // Refresh failed somewhere in the app: drop to the login page.
  useEffect(() => onSessionExpired(reset), [reset])

  const login = useCallback(
    async (email: string, password: string) => {
      const pair = await api<TokenResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        anonymous: true,
      })
      tokens.set(pair)
      await loadUser()
    },
    [loadUser],
  )

  const signup = useCallback(
    async (input: SignupInput) => {
      await api<User>('/auth/signup', { method: 'POST', body: input, anonymous: true })
      await login(input.email, input.password)
    },
    [login],
  )

  const value = useMemo(
    () => ({ user, status, login, signup, logout: reset }),
    [user, status, login, signup, reset],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- hook lives with its provider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
