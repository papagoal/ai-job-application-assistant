import { Link } from 'react-router-dom'
import ApplicationCard from '../components/ApplicationCard'
import { mockApplications } from '../mocks/applications'

function DashboardPage() {
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
        <Link className="primary-action page-action" to="/applications/new">
          New Application
        </Link>
      </div>

      <div className="application-grid">
        {mockApplications.map((application) => (
          <ApplicationCard key={application.id} application={application} />
        ))}
      </div>
    </section>
  )
}

export default DashboardPage
