import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { useFeedback } from '../components/Feedback'
import { PageLoader, Spinner } from '../components/ui'

export default function ResetPassword() {
  const { user, loading, clearRecovery } = useAuth()
  const navigate = useNavigate()
  const { toast } = useFeedback()
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return <PageLoader />

  if (!user) {
    return (
      <main className="auth-page">
        <div className="auth-card auth-card--center">
          <h1>Link expired</h1>
          <p>This password reset link is invalid or has already been used. Request a fresh one.</p>
          <Link to="/login?mode=forgot" className="btn btn--primary">
            Send a new link
          </Link>
        </div>
      </main>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Password needs to be at least 8 characters.')
    if (password !== confirmPw) return setError('Passwords don’t match.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(error.message)
    clearRecovery()
    toast('Password updated. You’re signed in.', 'success')
    navigate('/', { replace: true })
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-head">
          <h1>Set a new password</h1>
          <p>For {user.email}</p>
        </div>
        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span>New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <label className="field">
            <span>Repeat new password</span>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button className="btn btn--primary btn--block" disabled={busy}>
            {busy && <Spinner />} Save password
          </button>
        </form>
      </div>
    </main>
  )
}
