import { Link, useParams } from 'react-router-dom'

function AnalysisResultPage() {
  const { id } = useParams()

  return (
    <section className="analysis-page">
      <div className="analysis-heading">
        <div>
          <p className="eyebrow">Application analysis</p>
          <h1>Frontend Developer</h1>
          <p className="page-description">Northstar Labs · Application ID: {id}</p>
        </div>
        <Link className="secondary-action" to="/">Back to Dashboard</Link>
      </div>

      <div className="analysis-layout">
        <aside className="analysis-score-card" aria-labelledby="match-score-heading">
          <p className="analysis-label" id="match-score-heading">Match score</p>
          <div className="analysis-score" aria-label="82 percent match">
            <strong>82</strong>
            <span>/ 100</span>
          </div>
          <p className="score-summary">Strong overall match</p>
          <p className="score-description">
            Your frontend experience aligns well with the core requirements for this role.
          </p>
        </aside>

        <div className="analysis-content">
          <section className="analysis-panel">
            <div className="analysis-panel-heading">
              <div>
                <p className="analysis-label">Skills comparison</p>
                <h2>What matches and what is missing</h2>
              </div>
            </div>

            <div className="skills-columns">
              <div>
                <h3>Matching skills</h3>
                <ul className="skill-list matching-skills">
                  <li>React</li>
                  <li>TypeScript</li>
                  <li>Responsive design</li>
                  <li>Git</li>
                </ul>
              </div>
              <div>
                <h3>Missing skills</h3>
                <ul className="skill-list missing-skills">
                  <li>Jest</li>
                  <li>CI/CD</li>
                  <li>Accessibility testing</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="analysis-panel">
            <div className="analysis-panel-heading">
              <div>
                <p className="analysis-label">Resume improvements</p>
                <h2>Suggestions for this application</h2>
              </div>
            </div>
            <ol className="suggestion-list">
              <li>Highlight measurable impact from your React projects.</li>
              <li>Add examples of automated testing or quality assurance work.</li>
              <li>Mention accessibility practices used in production interfaces.</li>
            </ol>
          </section>

          <section className="analysis-panel">
            <div className="analysis-panel-heading">
              <div>
                <p className="analysis-label">Cover letter</p>
                <h2>Generated draft</h2>
              </div>
            </div>
            <div className="cover-letter-preview">
              <p>Dear Hiring Manager,</p>
              <p>
                I am excited to apply for the Frontend Developer role at Northstar Labs.
                My experience building responsive React and TypeScript applications aligns
                closely with the needs described in this position.
              </p>
              <p>
                I would welcome the opportunity to bring my frontend development skills and
                product-focused approach to your team.
              </p>
              <p>Sincerely,<br />Your Name</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default AnalysisResultPage
