import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ProfileLite } from '../lib/types'
import { displayName } from '../lib/format'

const AVATAR_COLORS = ['#3d8bff', '#ff3e7f', '#ffc933', '#2fd48a', '#ff8a3d', '#a78bfa']

export function Avatar({
  profile,
  size = 36,
}: {
  profile?: Pick<ProfileLite, 'username' | 'display_name' | 'avatar_url'> | null
  size?: number
}) {
  const [broken, setBroken] = useState(false)
  const name = displayName(profile ?? null)
  const seed = (profile?.username ?? name).split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)
  const bg = AVATAR_COLORS[seed % AVATAR_COLORS.length]
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) }

  if (profile?.avatar_url && !broken) {
    return (
      <img
        className="avatar"
        src={profile.avatar_url}
        alt=""
        style={style}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    )
  }
  return (
    <span className="avatar avatar--initial" style={{ ...style, background: bg }} aria-hidden>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export function UserChip({ profile, sub }: { profile?: ProfileLite | null; sub?: ReactNode }) {
  const inner = (
    <>
      <Avatar profile={profile} size={32} />
      <span className="user-chip-text">
        <span className="user-chip-name">{displayName(profile)}</span>
        {sub && <span className="user-chip-sub">{sub}</span>}
      </span>
    </>
  )
  return profile ? (
    <Link to={`/u/${profile.username}`} className="user-chip">
      {inner}
    </Link>
  ) : (
    <span className="user-chip">{inner}</span>
  )
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="spinner" role="status">
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner />
    </div>
  )
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-grid" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={i === 4 ? 'is-free' : i === 0 || i === 8 ? 'is-marked' : ''} />
        ))}
      </div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  )
}

type IconName =
  | 'heart'
  | 'heartFill'
  | 'comment'
  | 'share'
  | 'edit'
  | 'trash'
  | 'plus'
  | 'shuffle'
  | 'eye'
  | 'eyeOff'
  | 'lock'
  | 'crown'
  | 'check'
  | 'menu'
  | 'x'
  | 'logout'
  | 'settings'
  | 'grid'
  | 'user'
  | 'send'
  | 'mark'
  | 'sun'
  | 'moon'

const ICONS: Record<IconName, ReactNode> = {
  heart: <path d="M19.5 12.6 12 20l-7.5-7.4A4.9 4.9 0 0 1 12 6.1a4.9 4.9 0 0 1 7.5 6.5Z" />,
  heartFill: (
    <path fill="currentColor" d="M19.5 12.6 12 20l-7.5-7.4A4.9 4.9 0 0 1 12 6.1a4.9 4.9 0 0 1 7.5 6.5Z" />
  ),
  comment: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />,
  share: (
    <>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="m16 6-4-4-4 4" />
      <path d="M12 2v13" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.4 3.6a2 2 0 0 1 2.9 2.9L7.5 18.3 4 19l.7-3.5Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  shuffle: (
    <>
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="m15 15 6 6" />
      <path d="m4 4 5 5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M10.7 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.2 3.1" />
      <path d="M6.6 6.6A16.6 16.6 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="m2 2 20 20" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  crown: <path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5Z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20.4 14.6A8.5 8.5 0 0 1 9.4 3.6a8.5 8.5 0 1 0 11 11Z" />,
  mark: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8.5 8.5 7 7" />
      <path d="m15.5 8.5-7 7" />
    </>
  ),
}
