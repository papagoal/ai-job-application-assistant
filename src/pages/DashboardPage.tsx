import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ApplicationCard from '../components/ApplicationCard'
import { getApplications } from '../services/persistenceService'
import type { ApplicationStatus, SavedApplication } from '../types/application'

type StatusFilter = 'All' | ApplicationStatus
type SortOrder = 'newest' | 'oldest' | 'highest-match' | 'lowest-match'

const statusFilters: StatusFilter[] = ['All', 'Draft', 'Applied', 'Interview']

function DashboardPage() {
  const [applications, setApplications] = useState<SavedApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

  useEffect(() => {
    void getApplications()
      .then(setApplications)
      .catch(() => setLoadError('Applications could not be loaded. Please try again.'))
      .finally(() => setIsLoading(false))
  }, [])

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredApplications = applications.filter((application) => {
    const matchesStatus = statusFilter === 'All' || application.status === statusFilter
    const matchesSearch = !normalizedSearchQuery
      || application.companyName.toLowerCase().includes(normalizedSearchQuery)
      || application.jobTitle.toLowerCase().includes(normalizedSearchQuery)

    return matchesStatus && matchesSearch
  })

  const visibleApplications = (() => {
    if (sortOrder === 'newest') return filteredApplications
    if (sortOrder === 'oldest') return [...filteredApplications].reverse()

    return [...filteredApplications].sort((firstApplication, secondApplication) => (
      sortOrder === 'highest-match'
        ? secondApplication.matchScore - firstApplication.matchScore
        : firstApplication.matchScore - secondApplication.matchScore
    ))
  })()

  function resetDashboardView() {
    setSearchQuery('')
    setStatusFilter('All')
    setSortOrder('newest')
  }

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
        <div className="dashboard-controls">
          <div className="dashboard-control-row">
            <div className="application-search" role="search">
              <label htmlFor="application-search">Search applications</label>
              <div className="application-search-input">
                <input
                  id="application-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search company or job title"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="application-sort">
              <label htmlFor="application-sort">Sort by</label>
              <select
                id="application-sort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest-match">Highest match</option>
                <option value="lowest-match">Lowest match</option>
              </select>
            </div>
          </div>

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
        </div>
      )}

      {isLoading ? (
        <div className="empty-state"><p>Loading applications…</p></div>
      ) : loadError ? (
        <div className="empty-state"><h2>Unable to load applications</h2><p>{loadError}</p></div>
      ) : visibleApplications.length > 0 ? (
        <div className="application-grid">
          {visibleApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="empty-state">
          <h2>{normalizedSearchQuery ? 'No applications match your search' : `No ${statusFilter.toLowerCase()} applications`}</h2>
          <p>Try another company, job title, or status.</p>
          <button
            className="secondary-action status-filter-reset"
            type="button"
            onClick={resetDashboardView}
          >
            Clear search and filters
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
