import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApplication } from '../services/persistenceService'
import type { JobAnalysis } from '../types/jobAnalysis'

interface AnalysisLocationState {
  analysis?: JobAnalysis
}

function AnalysisResultPage() {
  const { id } = useParams()
  const location = useLocation()
  const state = location.state as AnalysisLocationState | null
  const [analysis, setAnalysis] = useState<JobAnalysis | undefined>(state?.analysis)
  const [isLoading, setIsLoading] = useState(!state?.analysis)

  useEffect(() => {
    if (analysis || !id) return
    void getApplication(id)
      .then((application) => setAnalysis(application?.analysis))
      .catch(() => setAnalysis(undefined))
      .finally(() => setIsLoading(false))
  }, [analysis, id])

  if (isLoading) {
    return <section className="empty-state"><p>Loading analysis…</p></section>
  }

  if (!analysis) {
    return (
      <section className="empty-state">
        <h1>Analysis not found</h1>
        <p>This application may have been removed or saved in another browser.</p>
        <Link className="primary-action" to="/">Back to Dashboard</Link>
      </section>
    )
  }

  return (
    <section className="analysis-page">
      <div className="analysis-heading">
        <div>
          <p className="eyebrow">Application analysis</p>
          <h1>{analysis.jobTitle}</h1>
          <p className="page-description">
            {analysis.companyName} · Application ID: {id}
          </p>
        </div>
        <Link className="secondary-action" to="/">Back to Dashboard</Link>
      </div>

      <div className="analysis-layout">
        <aside className="analysis-score-card" aria-labelledby="match-score-heading">
          <p className="analysis-label" id="match-score-heading">Match score</p>
          <div
            className="analysis-score"
            aria-label={`${analysis.matchScore} percent match`}
          >
            <strong>{analysis.matchScore}</strong>
            <span>/ 100</span>
          </div>
          <p className="score-summary">{analysis.scoreSummary}</p>
          <p className="score-description">{analysis.scoreDescription}</p>
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
                  {analysis.matchingSkills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Missing skills</h3>
                <ul className="skill-list missing-skills">
                  {analysis.missingSkills.map((skill) => (
                    <li key={skill}>{skill}</li>
                  ))}
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
              {analysis.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
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
              <p>{analysis.coverLetter}</p>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default AnalysisResultPage
