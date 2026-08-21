import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ApplicationCard from '../components/ApplicationCard'
import ApplicationTable from '../components/ApplicationTable'
import { getApplications } from '../services/persistenceService'
import type { ApplicationStatus, SavedApplication } from '../types/application'

type StatusFilter = 'All' | ApplicationStatus
type SortOrder = 'newest' | 'oldest' | 'highest-match' | 'lowest-match'
type ViewMode = 'cards' | 'table'

const statusFilters: StatusFilter[] = [
  'All',
  'Draft',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]

function TableIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="3" width="15" height="14" rx="2" />
      <path d="M2.5 8h15M7.5 3v14" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="3" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="3" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="12" width="6" height="5" rx="1.5" />
      <rect x="11.5" y="12" width="6" height="5" rx="1.5" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M10 2.5v10M6.5 9 10 12.5 13.5 9" />
      <path d="M3 12.5v3A1.5 1.5 0 0 0 4.5 17h11a1.5 1.5 0 0 0 1.5-1.5v-3" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5" />
      <path d="m12.5 12.5 4 4" />
    </svg>
  )
}

function encodeCsvCell(value: string | number) {
  let cell = String(value)

  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`
  return `"${cell.replace(/"/g, '""')}"`
}

function DashboardPage() {
  const [applications, setApplications] = useState<SavedApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [isCsvExported, setIsCsvExported] = useState(false)
  const [csvExportError, setCsvExportError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

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

  const averageMatchScore = applications.length > 0
    ? Math.round(
        applications.reduce((total, application) => total + application.matchScore, 0)
        / applications.length,
      )
    : 0

  const applicationSummary = [
    {
      label: 'Total applications',
      value: applications.length,
      detail: 'Roles in your tracker',
    },
    {
      label: 'Average match',
      value: `${averageMatchScore}%`,
      detail: 'Across every saved role',
    },
    {
      label: 'Applied',
      value: applications.filter((application) => application.status === 'Applied').length,
      detail: 'Applications submitted',
    },
    {
      label: 'Interviews',
      value: applications.filter((application) => application.status === 'Interview').length,
      detail: 'Active conversations',
    },
    {
      label: 'Offers',
      value: applications.filter((application) => application.status === 'Offer').length,
      detail: 'Successful outcomes',
    },
  ]

  function resetDashboardView() {
    setSearchQuery('')
    setStatusFilter('All')
    setSortOrder('newest')
  }

  function handleExportCsv() {
    setIsCsvExported(false)
    setCsvExportError('')

    try {
      const rows = [
        ['Company', 'Job title', 'Status', 'Match score (%)', 'Created date'],
        ...applications.map((application) => [
          application.companyName,
          application.jobTitle,
          application.status,
          application.matchScore,
          application.createdAt,
        ]),
      ]
      const csv = rows
        .map((row) => row.map((cell) => encodeCsvCell(cell)).join(','))
        .join('\r\n')
      const file = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' })
      const downloadUrl = URL.createObjectURL(file)
      const downloadLink = document.createElement('a')

      downloadLink.href = downloadUrl
      downloadLink.download = `job-applications-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.append(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      URL.revokeObjectURL(downloadUrl)
      setIsCsvExported(true)
    } catch {
      setCsvExportError('Applications could not be exported. Please try again.')
    }
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading dashboard-page-heading">
        <div>
          <p className="eyebrow">Workspace overview</p>
          <h1>Your applications</h1>
          <p className="page-description">
            Review your job matches and continue working on saved applications.
          </p>
        </div>
        {!isLoading && !loadError && applications.length > 0 && (
          <div className="dashboard-export">
            <div className="dashboard-heading-actions">
              <button
                className="secondary-action dashboard-view-button"
                type="button"
                aria-pressed={viewMode === 'table'}
                onClick={() => setViewMode((currentView) => (
                  currentView === 'cards' ? 'table' : 'cards'
                ))}
              >
                {viewMode === 'cards' ? <TableIcon /> : <CardIcon />}
                <span>{viewMode === 'cards' ? 'Table view' : 'Card view'}</span>
              </button>
              <button
                className="secondary-action dashboard-export-button"
                type="button"
                onClick={handleExportCsv}
              >
                <ExportIcon />
                <span>{isCsvExported ? 'Exported!' : 'Export CSV'}</span>
              </button>
            </div>
            {csvExportError && <p role="alert">{csvExportError}</p>}
          </div>
        )}
      </div>

      {!isLoading && !loadError && applications.length > 0 && (
        <dl className="application-summary" aria-label="Application summary">
          {applicationSummary.map((item) => (
            <div className="summary-card" key={item.label}>
              <dt>{item.label}</dt>
              <dd className="summary-card-value">{item.value}</dd>
              <dd className="summary-card-detail">{item.detail}</dd>
            </div>
          ))}
        </dl>
      )}

      {!isLoading && !loadError && applications.length > 0 && (
        <div className="dashboard-controls">
          <div className="dashboard-control-row">
            <div className="application-search" role="search">
              <label htmlFor="application-search">Search applications</label>
              <div className="application-search-input">
                <SearchIcon />
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

          <div className="dashboard-controls-footer">
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
            <p className="application-result-count" aria-live="polite">
              Showing {visibleApplications.length} of {applications.length}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="empty-state"><p>Loading applications…</p></div>
      ) : loadError ? (
        <div className="empty-state"><h2>Unable to load applications</h2><p>{loadError}</p></div>
      ) : visibleApplications.length > 0 ? (
        viewMode === 'cards' ? (
          <div className="application-grid">
            {visibleApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        ) : (
          <ApplicationTable applications={visibleApplications} />
        )
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
