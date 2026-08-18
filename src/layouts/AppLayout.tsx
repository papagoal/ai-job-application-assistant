import { Link, NavLink, Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-content">
          <Link className="brand" to="/" aria-label="Job Application Assistant home">
            Job Application Assistant
          </Link>

          <nav className="main-navigation" aria-label="Main navigation">
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/account">Account</NavLink>
          </nav>

          <Link className="primary-action" to="/applications/new">
            New Application
          </Link>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
