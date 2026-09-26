import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import BoardTile from '../components/BoardTile'
import { Avatar, EmptyState, Icon, PageLoader } from '../components/ui'
import { errorMessage, fetchBoardsByOwner, fetchProfileByUsername } from '../lib/api'
import { displayName, formatDate } from '../lib/format'
import type { Board, Profile } from '../lib/types'

export default function ProfilePage() {
  const { username = '' } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setState('loading')
    ;(async () => {
      try {
        const p = await fetchProfileByUsername(username)
        if (!active) return
        if (!p) return setState('missing')
        setProfile(p)
        setBoards(await fetchBoardsByOwner(p.id))
        if (active) setState('ready')
      } catch (e) {
        if (!active) return
        setError(errorMessage(e))
        setState('error')
      }
    })()
    return () => {
      active = false
    }
  }, [username])

  if (state === 'loading') return <PageLoader />
  if (state === 'missing' || state === 'error' || !profile) {
    return (
      <main className="container page">
        <EmptyState title={state === 'error' ? 'Something went wrong' : 'No such player'} action={<Link to="/" className="btn btn--primary">Browse cards</Link>}>
          {state === 'error' ? error : `We couldn’t find @${username}.`}
        </EmptyState>
      </main>
    )
  }

  const isMe = user?.id === profile.id
  const totalLikes = boards.reduce((n, b) => n + b.like_count, 0)

  return (
    <main className="container page">
      <section className="profile-head">
        <Avatar profile={profile} size={84} />
        <div>
          <h1>
            {displayName(profile)}{' '}
            {profile.is_premium && (
              <span className="tag tag--gold" title="Premium">
                <Icon name="crown" size={12} /> Premium
              </span>
            )}
          </h1>
          <p className="muted">
            @{profile.username} · joined {formatDate(profile.created_at)}
          </p>
          <div className="profile-stats">
            <span>
              <strong>{boards.length}</strong> {boards.length === 1 ? 'card' : 'cards'}
            </span>
            <span>
              <strong>{totalLikes}</strong> likes received
            </span>
          </div>
        </div>
        {isMe && (
          <Link to="/settings" className="btn btn--ghost btn--sm profile-edit">
            <Icon name="settings" size={15} /> Edit profile
          </Link>
        )}
      </section>

      {boards.length === 0 ? (
        <EmptyState title={isMe ? 'You haven’t made a card yet' : 'No public cards yet'}>
          {isMe ? <Link to="/new">Make one now →</Link> : 'Check back later.'}
        </EmptyState>
      ) : (
        <div className="tile-grid">
          {boards.map((b) => (
            <BoardTile key={b.id} board={b} showOwner={false} />
          ))}
        </div>
      )}
    </main>
  )
}
