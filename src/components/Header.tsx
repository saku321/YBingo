import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { displayName } from '../lib/format'
import { Avatar, Icon } from './ui'
import { useFeedback } from './Feedback'
import { useTheme } from '../lib/theme'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="YearlyBingos home">
      <span className="logo-ball" aria-hidden>
        Y
      </span>
      <span className="logo-word">
        Yearly<span>Bingos</span>
      </span>
    </Link>
  )
}

export default function Header() {
  const { user, profile, loading, signOut } = useAuth()
  const { toast } = useFeedback()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [theme, toggleTheme] = useTheme()

  useEffect(() => {
    setMenuOpen(false)
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleSignOut = async () => {
    await signOut()
    toast('Signed out. See you next round.')
    navigate('/')
  }

  const loginHref = `/login?next=${encodeURIComponent(location.pathname + location.search)}`

  return (
    <header className="site-header">
      <div className="container header-row">
        <Logo />

        <nav className={`main-nav ${navOpen ? 'is-open' : ''}`} aria-label="Main">
          <NavLink to="/" end>
            Explore
          </NavLink>
          <NavLink to="/new">Create</NavLink>
          {user && <NavLink to="/me">My cards</NavLink>}
          <NavLink to="/premium">Premium</NavLink>
        </nav>

        <div className="header-actions">
          <button
            className="icon-btn theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          {loading ? (
            <span className="header-skeleton" aria-hidden />
          ) : user ? (
            <>
              <Link to="/new" className="btn btn--primary btn--sm hide-sm">
                <Icon name="plus" size={16} /> New card
              </Link>
              <div className="account" ref={menuRef}>
                <button
                  className="account-btn"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <Avatar profile={profile} size={34} />
                  {profile?.is_premium && (
                    <span className="crown-badge" title="Premium">
                      <Icon name="crown" size={11} />
                    </span>
                  )}
                </button>
                {menuOpen && (
                  <div className="account-menu" role="menu">
                    <div className="account-menu-head">
                      <strong>{displayName(profile)}</strong>
                      <span>{profile ? `@${profile.username}` : user.email}</span>
                    </div>
                    {profile && (
                      <Link role="menuitem" to={`/u/${profile.username}`}>
                        <Icon name="user" size={16} /> Profile
                      </Link>
                    )}
                    <Link role="menuitem" to="/me">
                      <Icon name="grid" size={16} /> My cards
                    </Link>
                    <Link role="menuitem" to="/settings">
                      <Icon name="settings" size={16} /> Settings
                    </Link>
                    <Link role="menuitem" to="/premium">
                      <Icon name="crown" size={16} /> {profile?.is_premium ? 'Premium active' : 'Go Premium'}
                    </Link>
                    <button role="menuitem" onClick={handleSignOut}>
                      <Icon name="logout" size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to={loginHref} className="btn btn--ghost btn--sm">
                Sign in
              </Link>
              <Link to="/login?mode=signup&next=%2Fnew" className="btn btn--primary btn--sm hide-sm">
                Make a card
              </Link>
            </>
          )}
          <button
            className="icon-btn nav-toggle"
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
            onClick={() => setNavOpen((o) => !o)}
          >
            <Icon name={navOpen ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  )
}
