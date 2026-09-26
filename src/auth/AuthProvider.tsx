import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { fetchProfile } from '../lib/api'
import type { Profile } from '../lib/types'

type AuthContextValue = {
  session: Session | null
  user: User | null
  profile: Profile | null
  /** True until the stored session (or an OAuth/email redirect) has been processed. */
  loading: boolean
  profileLoading: boolean
  /** Set when the user arrived through a password-reset link. */
  recovery: boolean
  clearRecovery: () => void
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    // Keep this callback synchronous: supabase-js warns against awaiting other
    // Supabase calls in here. Profile loading happens in the effect below.
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
      setLoading(false)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id

  const loadProfile = useCallback(async (id: string) => {
    setProfileLoading(true)
    try {
      setProfile(await fetchProfile(id))
    } catch (err) {
      console.error('Could not load profile', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    void loadProfile(userId)
  }, [userId, loadProfile])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      recovery,
      clearRecovery: () => setRecovery(false),
      refreshProfile: async () => {
        if (userId) await loadProfile(userId)
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
          // A failed server-side revoke still clears the local session.
          await supabase.auth.signOut({ scope: 'local' })
        }
        setProfile(null)
      },
    }),
    [session, profile, loading, profileLoading, recovery, userId, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
