import { Link } from 'react-router-dom'
import type { ApplicationSummary } from '../types/application'

interface ApplicationCardProps {
  application: ApplicationSummary
}

function ApplicationCard({ application }: ApplicationCardProps) {
  const { id, companyName, jobTitle, matchScore, status, createdAt } = application

  return (
    <article className="application-card">
      <div className="application-card-header">
        <div>
          <p className="company-name">{companyName}</p>
          <h2>{jobTitle}</h2>
        </div>
        <div className="match-score" aria-label={`${matchScore}% match`}>
          <strong>{matchScore}%</strong>
          <span>Match</span>
        </div>
      </div>

      <div className="application-card-footer">
        <div className="application-meta">
          <span className={`status status-${status.toLowerCase()}`}>{status}</span>
          <time>{createdAt}</time>
        </div>
        <Link to={`/applications/${id}`} aria-label={`View ${jobTitle} at ${companyName}`}>
          View analysis <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

export default ApplicationCard
