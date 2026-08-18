import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ApplicationCard from '../components/ApplicationCard'
import { getApplications } from '../services/persistenceService'
import type { SavedApplication } from '../types/application'

function DashboardPage() {
  const [applications, setApplications] = useState<SavedApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    void getApplications()
      .then(setApplications)
      .catch(() => setLoadError('Applications could not be loaded. Please try again.'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Application tracker</p>
          <h1>Your applications</h1>
          <p className="page-description">
            Review your job matches and continue working on saved applications.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state"><p>Loading applications…</p></div>
      ) : loadError ? (
        <div className="empty-state"><h2>Unable to load applications</h2><p>{loadError}</p></div>
      ) : applications.length > 0 ? (
        <div className="application-grid">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No applications yet</h2>
          <p>Add a role to compare its requirements with your resume.</p>
          <Link className="primary-action" to="/applications/new">Add your first application</Link>
        </div>
      )}
    </section>
  )
}

export default DashboardPage
