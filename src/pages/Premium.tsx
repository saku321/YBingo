import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useAuth } from '../auth/AuthProvider'
import BingoTicket from '../components/BingoTicket'
import { useFeedback } from '../components/Feedback'
import { Icon, PageLoader } from '../components/ui'
import { COLOR_PRESETS, DEFAULT_COLORS, PREMIUM_PRICE, defaultYear, winningCells } from '../lib/bingo'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/theme'
import type { CardColors, Cell } from '../lib/types'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim()

const PERKS = [
  ['Unlimited cards', 'Free accounts keep up to 10 cards. Premium has no cap.'],
  ['Custom colors', 'Pick the card, text, line, X and free-space colors.'],
  ['Theme presets', 'Classic, Night, Paper, Ocean, Sunset — one click.'],
  ['Crown badge', 'A little crown next to your name everywhere.'],
]

const preset = (name: string): CardColors => COLOR_PRESETS.find((p) => p.name === name)?.colors ?? DEFAULT_COLORS

/**
 * The demo cards loop through the presets plus a few mixes made with the color pickers,
 * split by background so they always match the site's light or dark theme.
 */
const LIGHT_THEMES: CardColors[] = [
  preset('Classic'),
  preset('Sunset'),
  preset('Paper'),
  // Mint
  {
    background: '#ecfbf4',
    text: '#0f3d2e',
    lines: '#c3eadb',
    centerFrom: '#10b981',
    centerTo: '#0891b2',
    marker: '#059669',
  },
]

const DARK_THEMES: CardColors[] = [
  preset('Night'),
  preset('Ocean'),
  // Grape
  {
    background: '#1c1530',
    text: '#f1ebff',
    lines: '#372b57',
    centerFrom: '#a855f7',
    centerTo: '#ec4899',
    marker: '#f472b6',
  },
  // Neon
  {
    background: '#0b0c10',
    text: '#eafff2',
    lines: '#1f2b25',
    centerFrom: '#22ff88',
    centerTo: '#00c2ff',
    marker: '#39ff88',
  },
]

const DEMO: Cell[] = Array.from({ length: 25 }, (_, i) => ({
  text: ['Crown on', 'Neon card', 'Unlimited', 'Custom X', 'Mint mode'][i % 5],
  marked: [0, 6, 12, 18, 24, 3, 9].includes(i),
}))
const DEMO_2: Cell[] = DEMO.map((c, i) => ({ ...c, marked: i % 4 === 0 }))
const DEMO_WINS = winningCells(DEMO)
const DEMO_2_WINS = winningCells(DEMO_2)

/** Two tilted cards that keep changing themes. Hovering holds the current pair. */
function ThemeDemo() {
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)
  const [siteTheme] = useTheme()
  const reduced = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])

  useEffect(() => {
    if (reduced || paused) return
    const t = window.setInterval(() => setTick((n) => n + 1), 1600)
    return () => window.clearInterval(t)
  }, [reduced, paused])

  // The cards take turns changing, half a beat apart, and stay half the list apart so they never match.
  const themes = siteTheme === 'dark' ? DARK_THEMES : LIGHT_THEMES
  const back = themes[Math.floor(tick / 2) % themes.length]
  const front = themes[(Math.floor((tick + 1) / 2) + themes.length / 2) % themes.length]
  const year = defaultYear()

  return (
    <div className="premium-demo" aria-hidden onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* The wrappers carry the tilt, float and hover; the cards themselves fade between colors. */}
      <div className="premium-demo-card">
        <BingoTicket cells={DEMO} year={year} colors={back} wins={DEMO_WINS} className="ticket--morph" />
      </div>
      <div className="premium-demo-card">
        <BingoTicket cells={DEMO_2} year={year} colors={front} wins={DEMO_2_WINS} className="ticket--morph" />
      </div>
    </div>
  )
}

async function callPaypal(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('paypal', { body })
  if (error) {
    // Surface the function's JSON error message when there is one.
    const ctx = (error as { context?: Response }).context
    const detail = ctx ? await ctx.json().catch(() => null) : null
    throw new Error(detail?.error ?? error.message)
  }
  return data as { id?: string; ok?: boolean; error?: string }
}

export default function Premium() {
  const { user, profile, profileLoading, refreshProfile } = useAuth()
  const { toast } = useFeedback()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (user && profileLoading && !profile) return <PageLoader />

  const isPremium = Boolean(profile?.is_premium) || done

  return (
    <main className="container page premium">
      <div className="premium-grid">
        <div className="premium-copy">
          <p className="eyebrow">
            <Icon name="crown" size={14} /> YearlyBingos Premium
          </p>
          <h1>Make your card look like yours.</h1>
          <p className="hero-lede">One payment, yours forever. Supports the site and unlocks the fun stuff.</p>

          <ul className="perks">
            {PERKS.map(([t, d]) => (
              <li key={t}>
                <span className="perk-check">
                  <Icon name="check" size={14} />
                </span>
                <div>
                  <strong>{t}</strong>
                  <span>{d}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="price-card">
            {isPremium ? (
              <div className="premium-active">
                <span className="tag tag--gold">
                  <Icon name="crown" size={12} /> Premium active
                </span>
                <p>Thanks for supporting YearlyBingos! Custom colors are unlocked in the card editor.</p>
                <Link to="/new" className="btn btn--primary">
                  Make a styled card
                </Link>
              </div>
            ) : !user ? (
              <>
                <div className="price">
                  <strong>${PREMIUM_PRICE}</strong> <span>one-time</span>
                </div>
                <Link to="/login?next=%2Fpremium" className="btn btn--primary btn--block">
                  Sign in to upgrade
                </Link>
              </>
            ) : !PAYPAL_CLIENT_ID ? (
              <>
                <div className="price">
                  <strong>${PREMIUM_PRICE}</strong> <span>one-time</span>
                </div>
                <div className="banner">Checkout isn’t switched on yet. Check back soon.</div>
              </>
            ) : (
              <>
                <div className="price">
                  <strong>${PREMIUM_PRICE}</strong> <span>one-time · USD</span>
                </div>
                {error && <div className="form-error">{error}</div>}
                <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: 'USD', intent: 'capture' }}>
                  <PayPalButtons
                    style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', tagline: false }}
                    createOrder={async () => {
                      setError(null)
                      const res = await callPaypal({ action: 'create' })
                      if (!res.id) throw new Error(res.error ?? 'Could not start checkout')
                      return res.id
                    }}
                    onApprove={async (data) => {
                      try {
                        await callPaypal({ action: 'capture', orderID: data.orderID })
                        setDone(true)
                        await refreshProfile()
                        toast('Premium unlocked 👑', 'success')
                      } catch (err) {
                        setError((err as Error).message)
                      }
                    }}
                    onError={(err) => setError(err instanceof Error ? err.message : 'Payment failed. You were not charged.')}
                  />
                </PayPalScriptProvider>
              </>
            )}
            {!isPremium && (
              <p className="price-note">
                Paid securely through PayPal. Changed your mind? Full refund within 14 days — see the{' '}
                <Link to="/terms">Terms</Link>.
              </p>
            )}
          </div>
        </div>
        <ThemeDemo />
      </div>
    </main>
  )
}
