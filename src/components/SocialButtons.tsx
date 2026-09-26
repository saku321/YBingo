import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useFeedback } from './Feedback'
import { Spinner } from './ui'

type Provider = 'google' | 'x'

let settingsPromise: Promise<Record<string, boolean> | null> | null = null

/** Reads which OAuth providers are switched on (public GoTrue endpoint). */
function loadEnabledProviders(): Promise<Record<string, boolean> | null> {
  if (!settingsPromise) {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
    settingsPromise = fetch(`${url}/auth/v1/settings`, { headers: { apikey: key ?? '' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.external as Record<string, boolean>) ?? null)
      .catch(() => null)
  }
  return settingsPromise
}

const LABEL: Record<Provider, string> = { google: 'Google', x: 'X' }

export default function SocialButtons({ next }: { next: string }) {
  const { toast } = useFeedback()
  const [pending, setPending] = useState<Provider | null>(null)
  const [enabled, setEnabled] = useState<Record<string, boolean> | null>(null)

  useEffect(() => {
    void loadEnabledProviders().then(setEnabled)
  }, [])

  const go = async (provider: Provider) => {
    // X has two Supabase providers: "x" (OAuth 2.0, current) and "twitter" (legacy OAuth 1.0a).
    let target: Provider | 'twitter' = provider
    let known = false
    if (enabled) {
      if (provider === 'x') {
        if (enabled.x) [target, known] = ['x', true]
        else if (enabled.twitter) [target, known] = ['twitter', true]
        else if ('x' in enabled) return notEnabled(provider)
      } else if (provider in enabled) {
        if (!enabled[provider]) return notEnabled(provider)
        known = true
      }
    }

    setPending(provider)
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: target,
      options: { redirectTo, skipBrowserRedirect: true },
    })
    if (error || !data?.url) {
      setPending(null)
      toast(error?.message ?? 'Could not start sign-in.', 'error')
      return
    }
    if (!known) {
      // Settings didn't say either way: ask the auth server before leaving the site,
      // so a disabled provider shows a friendly message instead of a raw JSON error page.
      const probe = await fetch(data.url, { redirect: 'manual' }).catch(() => null)
      if (probe && probe.type !== 'opaqueredirect' && probe.status >= 400) {
        setPending(null)
        return notEnabled(provider)
      }
    }
    window.location.assign(data.url)
  }

  function notEnabled(provider: Provider) {
    toast(`${LABEL[provider]} sign-in isn’t switched on in Supabase yet. Use email for now.`, 'error')
  }

  return (
    <div className="social">
      <button type="button" className="social-btn" onClick={() => go('google')} disabled={pending !== null}>
        {pending === 'google' ? <Spinner /> : <GoogleMark />}
        Continue with Google
      </button>
      <button type="button" className="social-btn" onClick={() => go('x')} disabled={pending !== null}>
        {pending === 'x' ? <Spinner /> : <XMark />}
        Continue with X
      </button>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function XMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"
      />
    </svg>
  )
}
