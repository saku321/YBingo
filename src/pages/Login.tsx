import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { isUsernameTaken } from '../lib/api'
import { safeNext } from '../lib/format'
import SocialButtons from '../components/SocialButtons'
import { useFeedback } from '../components/Feedback'
import { Icon, Spinner } from '../components/ui'

type Mode = 'signin' | 'signup' | 'forgot'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Wrong email or password.'
  if (/email not confirmed/i.test(message)) return 'Confirm your email first — check your inbox for the link.'
  if (/already registered|already been registered/i.test(message))
    return 'That email already has an account. Try signing in instead.'
  if (/password should be at least/i.test(message)) return 'Password needs to be at least 8 characters.'
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Wait a minute and try again.'
  if (/signups not allowed/i.test(message)) return 'New sign-ups are turned off for this site right now.'
  return message
}

export default function Login() {
  const [params, setParams] = useSearchParams()
  const next = safeNext(params.get('next'))
  const initialMode = (params.get('mode') as Mode) || 'signin'
  const [mode, setModeState] = useState<Mode>(['signin', 'signup', 'forgot'].includes(initialMode) ? initialMode : 'signin')
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useFeedback()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [sentTo, setSentTo] = useState<{ kind: 'confirm' | 'reset'; email: string } | null>(null)
  const [nameTaken, setNameTaken] = useState(false)

  const setMode = (m: Mode) => {
    setModeState(m)
    setError(null)
    setNeedsConfirm(false)
    const p = new URLSearchParams(params)
    if (m === 'signin') p.delete('mode')
    else p.set('mode', m)
    setParams(p, { replace: true })
  }

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true })
  }, [user, loading, next, navigate])

  const cleanUsername = username.trim().toLowerCase()
  useEffect(() => {
    setNameTaken(false)
    if (mode !== 'signup' || !USERNAME_RE.test(cleanUsername)) return
    const t = window.setTimeout(() => {
      isUsernameTaken(cleanUsername).then(setNameTaken)
    }, 350)
    return () => window.clearTimeout(t)
  }, [cleanUsername, mode])

  const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setNeedsConfirm(false)
    const cleanEmail = email.trim()

    if (mode === 'signup') {
      if (!USERNAME_RE.test(cleanUsername)) {
        setError('Username: 3–20 characters, lowercase letters, numbers or _.')
        return
      }
      if (nameTaken) {
        setError('That username is taken — try another.')
        return
      }
      if (password.length < 8) {
        setError('Password needs to be at least 8 characters.')
        return
      }
    }

    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        if (error) {
          if (/email not confirmed/i.test(error.message)) setNeedsConfirm(true)
          throw error
        }
        toast('Welcome back!', 'success')
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: callbackUrl,
            data: { username: cleanUsername, display_name: username.trim() },
          },
        })
        if (error) throw error
        if (data.session) {
          toast('Account created — let’s make your first card!', 'success')
        } else if (data.user && data.user.identities?.length === 0) {
          // Supabase hides whether an email exists; an empty identities list means it does.
          setError('That email already has an account. Try signing in instead.')
        } else {
          setSentTo({ kind: 'confirm', email: cleanEmail })
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setSentTo({ kind: 'reset', email: cleanEmail })
      }
    } catch (err) {
      setError(friendlyAuthError((err as Error).message))
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    const target = sentTo?.email ?? email.trim()
    if (!target) return
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: target,
      options: { emailRedirectTo: callbackUrl },
    })
    if (error) toast(friendlyAuthError(error.message), 'error')
    else toast('Sent another confirmation email.', 'success')
  }

  if (sentTo) {
    return (
      <main className="auth-page">
        <div className="auth-card auth-card--center">
          <div className="auth-mail" aria-hidden>
            ✉
          </div>
          <h1>Check your inbox</h1>
          <p>
            We sent a {sentTo.kind === 'confirm' ? 'confirmation' : 'password reset'} link to{' '}
            <strong>{sentTo.email}</strong>. Open it on this device to continue.
          </p>
          <div className="auth-row">
            {sentTo.kind === 'confirm' && (
              <button className="btn btn--ghost" onClick={resend}>
                Resend email
              </button>
            )}
            <button
              className="btn btn--primary"
              onClick={() => {
                setSentTo(null)
                setMode('signin')
              }}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <h1>
            {mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset password' : 'Welcome back'}
          </h1>
          <p>
            {mode === 'signup'
              ? 'Save your cards, share them and collect likes.'
              : mode === 'forgot'
                ? 'We’ll email you a link to set a new password.'
                : 'Sign in to make, share and mark your cards.'}
          </p>
        </div>

        {mode !== 'forgot' && (
          <>
            <div className="tabs" role="tablist">
              <button
                role="tab"
                aria-selected={mode === 'signin'}
                className={mode === 'signin' ? 'tab is-active' : 'tab'}
                onClick={() => setMode('signin')}
              >
                Sign in
              </button>
              <button
                role="tab"
                aria-selected={mode === 'signup'}
                className={mode === 'signup' ? 'tab is-active' : 'tab'}
                onClick={() => setMode('signup')}
              >
                Create account
              </button>
            </div>
            <SocialButtons next={next} />
            <div className="divider">
              <span>or with email</span>
            </div>
          </>
        )}

        <form className="form" onSubmit={onSubmit} noValidate>
          {mode === 'signup' && (
            <label className="field">
              <span>Username</span>
              <div className="input-prefix">
                <span>@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  autoComplete="username"
                  placeholder="bingoqueen"
                  maxLength={20}
                  required
                />
              </div>
              {nameTaken ? (
                <small className="field-error">That username is taken.</small>
              ) : (
                <small>3–20 characters: a–z, 0–9 and _</small>
              )}
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>

          {mode !== 'forgot' && (
            <div className="field">
              <span className="field-label-row">
                <label htmlFor="password">Password</label>
                {mode === 'signin' && (
                  <button type="button" className="link-btn" onClick={() => setMode('forgot')}>
                    Forgot password?
                  </button>
                )}
              </span>
              <div className="input-suffix">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  minLength={mode === 'signup' ? 8 : undefined}
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPw((s) => !s)}
                >
                  <Icon name={showPw ? 'eyeOff' : 'eye'} size={17} />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="form-error" role="alert">
              {error}
              {needsConfirm && (
                <button type="button" className="link-btn" onClick={resend}>
                  Resend confirmation email
                </button>
              )}
            </div>
          )}

          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy && <Spinner />}
            {mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
          </button>
        </form>

        <p className="auth-foot">
          {mode === 'forgot' ? (
            <button className="link-btn" onClick={() => setMode('signin')}>
              ← Back to sign in
            </button>
          ) : mode === 'signin' ? (
            <>
              New here?{' '}
              <button className="link-btn" onClick={() => setMode('signup')}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="link-btn" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </>
          )}
        </p>
        <p className="auth-legal">
          By continuing you agree to the <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  )
}
