import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  getCurrentUser,
  isSupabaseConfigured,
  signOut,
  subscribeToAuthChanges,
} from '../services/authService'

type IconProps = {
  children: ReactNode
}

function NavigationIcon({ children }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {children}
    </svg>
  )
}

function DashboardIcon() {
  return (
    <NavigationIcon>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </NavigationIcon>
  )
}

function ProfileIcon() {
  return (
    <NavigationIcon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </NavigationIcon>
  )
}

function PlusIcon() {
  return (
    <NavigationIcon>
      <path d="M12 5v14M5 12h14" />
    </NavigationIcon>
  )
}

function MenuIcon() {
  return (
    <NavigationIcon>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </NavigationIcon>
  )
}

function CloseIcon() {
  return (
    <NavigationIcon>
      <path d="m6 6 12 12M18 6 6 18" />
    </NavigationIcon>
  )
}

function AccountIcon() {
  return (
    <NavigationIcon>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="9" r="3" />
      <path d="M7.5 18a5 5 0 0 1 9 0" />
    </NavigationIcon>
  )
}

function LogoutIcon() {
  return (
    <NavigationIcon>
      <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
    </NavigationIcon>
  )
}

function getUserDetails(user: User | null) {
  if (!isSupabaseConfigured) {
    return {
      avatarUrl: '',
      initials: 'L',
      name: 'Local workspace',
      detail: 'Browser storage',
    }
  }

  if (!user || user.is_anonymous) {
    return {
      avatarUrl: '',
      initials: 'G',
      name: 'Guest workspace',
      detail: 'Connect your account',
    }
  }

  const fullName = typeof user.user_metadata.full_name === 'string'
    ? user.user_metadata.full_name
    : ''
  const emailName = user.email?.split('@')[0] ?? 'Account'
  const displayName = fullName || emailName
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A'

  return {
    avatarUrl: typeof user.user_metadata.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : '',
    initials,
    name: displayName,
    detail: user.email ?? 'Cloud account',
  }
}

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [accountMenuError, setAccountMenuError] = useState('')
  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const unsubscribe = subscribeToAuthChanges(setUser)
    void getCurrentUser().then(setUser).catch(() => setUser(null))

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isAccountMenuOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false)
        setAccountMenuError('')
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false)
        setAccountMenuError('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAccountMenuOpen])

  const userDetails = getUserDetails(user)
  const isConnectedAccount = Boolean(user && !user.is_anonymous)
  const closeMenu = () => {
    setIsMenuOpen(false)
    setIsAccountMenuOpen(false)
    setAccountMenuError('')
  }

  async function handleSidebarSignOut() {
    setAccountMenuError('')
    setIsSigningOut(true)

    try {
      await signOut()
      setUser(null)
      closeMenu()
      navigate('/account')
    } catch {
      setAccountMenuError('Log out failed. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="app-shell">
      <aside
        id="app-sidebar"
        className={`app-sidebar${isMenuOpen ? ' app-sidebar-open' : ''}`}
        aria-label="Application sidebar"
      >
        <div className="sidebar-header">
          <Link className="sidebar-brand" to="/" onClick={closeMenu}>
            <span className="brand-mark" aria-hidden="true">R</span>
            <span>RoleLumi</span>
          </Link>
          <button
            className="sidebar-close"
            type="button"
            aria-label="Close navigation"
            onClick={closeMenu}
          >
            <CloseIcon />
          </button>
        </div>

        <Link className="sidebar-create-action" to="/applications/new" onClick={closeMenu}>
          <PlusIcon />
          <span>New Application</span>
        </Link>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          <p className="sidebar-section-label">Workspace</p>
          <NavLink to="/" end onClick={closeMenu}>
            <DashboardIcon />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/profile" onClick={closeMenu}>
            <ProfileIcon />
            <span>Profile &amp; Resume</span>
          </NavLink>
        </nav>

        <div className="sidebar-account-wrapper" ref={accountMenuRef}>
          {isAccountMenuOpen && (
            <nav className="sidebar-account-popover" aria-label="Account menu">
              <NavLink className="sidebar-account-option" to="/account" onClick={closeMenu}>
                <AccountIcon />
                <span>Account</span>
              </NavLink>
              {isConnectedAccount && (
                <button
                  className="sidebar-account-option sidebar-account-logout"
                  type="button"
                  disabled={isSigningOut}
                  onClick={handleSidebarSignOut}
                >
                  <LogoutIcon />
                  <span>{isSigningOut ? 'Logging out…' : 'Log out'}</span>
                </button>
              )}
              {accountMenuError && (
                <p className="sidebar-account-error" role="alert">{accountMenuError}</p>
              )}
            </nav>
          )}

          <button
            className={`sidebar-account-trigger${location.pathname === '/account' ? ' active' : ''}`}
            type="button"
            aria-label={`Open account menu for ${userDetails.name}`}
            aria-haspopup="true"
            aria-expanded={isAccountMenuOpen}
            onClick={() => {
              setIsAccountMenuOpen((isOpen) => !isOpen)
              setAccountMenuError('')
            }}
          >
            <span className="sidebar-avatar" aria-hidden="true">
              {userDetails.avatarUrl ? (
                <img src={userDetails.avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : userDetails.initials}
            </span>
            <span className="sidebar-account-copy">
              <strong>{userDetails.name}</strong>
              <span>{userDetails.detail}</span>
            </span>
            <span className="sidebar-account-menu" aria-hidden="true">•••</span>
          </button>
        </div>
      </aside>

      {isMenuOpen && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={closeMenu}
        />
      )}

      <div className="app-main">
        <header className="mobile-app-bar">
          <Link className="mobile-brand" to="/" aria-label="RoleLumi home">
            <span className="brand-mark" aria-hidden="true">R</span>
            <span>RoleLumi</span>
          </Link>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Open navigation"
            aria-controls="app-sidebar"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
          >
            <MenuIcon />
          </button>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
