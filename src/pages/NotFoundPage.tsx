import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <main>
      <h1>Page Not Found</h1>
      <Link to="/">Return to Dashboard</Link>
    </main>
  )
}

export default NotFoundPage
