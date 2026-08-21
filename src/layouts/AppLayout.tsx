import { useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  getCurrentUser,
  isSupabaseConfigured,
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
  const [user, setUser] = useState<User | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const unsubscribe = subscribeToAuthChanges(setUser)
    void getCurrentUser().then(setUser).catch(() => setUser(null))

    return unsubscribe
  }, [])

  const userDetails = getUserDetails(user)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <div className="app-shell">
      <aside
        id="app-sidebar"
        className={`app-sidebar${isMenuOpen ? ' app-sidebar-open' : ''}`}
        aria-label="Application sidebar"
      >
        <div className="sidebar-header">
          <Link className="sidebar-brand" to="/" onClick={closeMenu}>
            <span className="brand-mark" aria-hidden="true">J</span>
            <span>Job Assistant</span>
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

        <NavLink className="sidebar-account" to="/account" onClick={closeMenu}>
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
        </NavLink>
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
          <Link className="mobile-brand" to="/" aria-label="Job Assistant home">
            <span className="brand-mark" aria-hidden="true">J</span>
            <span>Job Assistant</span>
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
