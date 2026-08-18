import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ApplicationCard from '../components/ApplicationCard'
import { getApplications } from '../services/persistenceService'
import type { ApplicationStatus, SavedApplication } from '../types/application'

type StatusFilter = 'All' | ApplicationStatus

const statusFilters: StatusFilter[] = ['All', 'Draft', 'Applied', 'Interview']

function DashboardPage() {
  const [applications, setApplications] = useState<SavedApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')

  useEffect(() => {
    void getApplications()
      .then(setApplications)
      .catch(() => setLoadError('Applications could not be loaded. Please try again.'))
      .finally(() => setIsLoading(false))
  }, [])

  const filteredApplications = statusFilter === 'All'
    ? applications
    : applications.filter((application) => application.status === statusFilter)

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

      {!isLoading && !loadError && applications.length > 0 && (
        <div className="status-filters" role="group" aria-label="Filter applications by status">
          {statusFilters.map((filter) => (
            <button
              className="status-filter-button"
              type="button"
              key={filter}
              aria-pressed={statusFilter === filter}
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="empty-state"><p>Loading applications…</p></div>
      ) : loadError ? (
        <div className="empty-state"><h2>Unable to load applications</h2><p>{loadError}</p></div>
      ) : filteredApplications.length > 0 ? (
        <div className="application-grid">
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="empty-state">
          <h2>No {statusFilter.toLowerCase()} applications</h2>
          <p>Choose another status or show all saved applications.</p>
          <button
            className="secondary-action status-filter-reset"
            type="button"
            onClick={() => setStatusFilter('All')}
          >
            Show all applications
          </button>
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
