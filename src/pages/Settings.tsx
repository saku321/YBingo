import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useFeedback } from '../components/Feedback'
import { Avatar, PageLoader, Spinner } from '../components/ui'
import { errorMessage, isUsernameTaken, updateProfile } from '../lib/api'
import { supabase } from '../lib/supabase'

const USERNAME_RE = /^[a-z0-9_]{3,20}$/

export default function Settings() {
  const { user, profile, profileLoading, refreshProfile, signOut } = useAuth()
  const { toast } = useFeedback()
  const navigate = useNavigate()
  const [displayNameVal, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pw, setPw] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setUsername(profile.username)
    setAvatarUrl(profile.avatar_url ?? '')
  }, [profile])

  if (!user || (profileLoading && !profile)) return <PageLoader />
  if (!profile) {
    return (
      <main className="container page narrow">
        <div className="banner banner--error">
          Your profile couldn’t be loaded. If you just set up the database, sign out and back in.
        </div>
      </main>
    )
  }

  const providers = (user.identities ?? []).map((i) => i.provider)
  const hasPassword = providers.includes('email')

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleanName = username.trim().toLowerCase()
    if (!USERNAME_RE.test(cleanName)) return setError('Username: 3–20 characters, lowercase letters, numbers or _.')
    const url = avatarUrl.trim()
    if (url && !/^https:\/\//i.test(url)) return setError('Avatar URL must start with https://')
    setSaving(true)
    try {
      if (cleanName !== profile.username && (await isUsernameTaken(cleanName, profile.id))) {
        setError('That username is already taken.')
        return
      }
      await updateProfile(profile.id, {
        username: cleanName,
        display_name: displayNameVal.trim() || null,
        avatar_url: url || null,
      })
      await refreshProfile()
      toast('Profile saved', 'success')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return toast('Password needs to be at least 8 characters.', 'error')
    setPwBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setPwBusy(false)
    if (error) return toast(error.message, 'error')
    setPw('')
    toast('Password updated', 'success')
  }

  return (
    <main className="container page narrow">
      <div className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
        </div>
      </div>

      <form className="panel form" onSubmit={saveProfile}>
        <h3>Profile</h3>
        <div className="settings-avatar">
          <Avatar profile={{ username, display_name: displayNameVal, avatar_url: avatarUrl || null }} size={64} />
          <p className="muted">This is how you appear on cards and in comments.</p>
        </div>
        <label className="field">
          <span>Display name</span>
          <input value={displayNameVal} maxLength={40} onChange={(e) => setDisplayName(e.target.value)} />
        </label>
        <label className="field">
          <span>Username</span>
          <div className="input-prefix">
            <span>@</span>
            <input
              value={username}
              maxLength={20}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
            />
          </div>
          <small>Your profile lives at /u/{username || 'username'}</small>
        </label>
        <label className="field">
          <span>Avatar image URL</span>
          <input
            value={avatarUrl}
            placeholder="https://…"
            onChange={(e) => setAvatarUrl(e.target.value)}
            inputMode="url"
          />
        </label>
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn--primary" disabled={saving}>
          {saving && <Spinner />} Save profile
        </button>
      </form>

      <section className="panel">
        <h3>Sign-in</h3>
        <dl className="kv">
          <dt>Email</dt>
          <dd>{user.email ?? '—'}</dd>
          <dt>Connected</dt>
          <dd>
            {providers.length
              ? providers.map((p) => (p === 'x' || p === 'twitter' ? 'X' : p[0].toUpperCase() + p.slice(1))).join(', ')
              : '—'}
          </dd>
        </dl>
        <form className="form form--inline" onSubmit={changePassword}>
          <label className="field">
            <span>{hasPassword ? 'Change password' : 'Add a password (sign in with email too)'}</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="New password, 8+ characters"
              autoComplete="new-password"
            />
          </label>
          <button className="btn btn--ghost" disabled={pwBusy || !pw}>
            {pwBusy && <Spinner />} Update
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>Session</h3>
        <button
          className="btn btn--ghost btn--danger-text"
          onClick={async () => {
            await signOut()
            navigate('/')
          }}
        >
          Sign out
        </button>
      </section>
    </main>
  )
}
