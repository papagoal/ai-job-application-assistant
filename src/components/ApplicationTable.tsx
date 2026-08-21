import { Link } from 'react-router-dom'
import type { SavedApplication } from '../types/application'

interface ApplicationTableProps {
  applications: SavedApplication[]
}

function ApplicationTable({ applications }: ApplicationTableProps) {
  return (
    <div
      className="application-table-container"
      role="region"
      aria-label="Application table"
      tabIndex={0}
    >
      <table className="application-table">
        <thead>
          <tr>
            <th scope="col">Company</th>
            <th scope="col">Position</th>
            <th scope="col">Status</th>
            <th scope="col">Date</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => {
            const notes = application.notes.trim()
            const analysisUrl = `/applications/${application.id}`

            return (
              <tr key={application.id}>
                <td>
                  <Link to={analysisUrl}>{application.companyName}</Link>
                </td>
                <td>
                  <Link to={analysisUrl}>{application.jobTitle}</Link>
                </td>
                <td>
                  <span className={`status status-${application.status.toLowerCase()}`}>
                    {application.status}
                  </span>
                </td>
                <td><time>{application.createdAt}</time></td>
                <td className="application-table-notes" title={notes || undefined}>
                  <span>{notes || '—'}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ApplicationTable
