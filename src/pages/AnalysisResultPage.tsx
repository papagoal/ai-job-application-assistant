import { useEffect, useState, type ChangeEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  deleteApplication,
  getApplication,
  updateApplicationCoverLetter,
  updateApplicationStatus,
} from '../services/persistenceService'
import type { ApplicationStatus } from '../types/application'
import type { JobAnalysis } from '../types/jobAnalysis'

interface AnalysisLocationState {
  analysis?: JobAnalysis
}

const applicationStatuses: ApplicationStatus[] = ['Draft', 'Applied', 'Interview']

function toFileNamePart(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    || 'application'
}

function AnalysisResultPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as AnalysisLocationState | null
  const [analysis, setAnalysis] = useState<JobAnalysis | undefined>(state?.analysis)
  const [isLoading, setIsLoading] = useState(!state?.analysis)
  const [status, setStatus] = useState<ApplicationStatus>('Draft')
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusError, setStatusError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isCoverLetterCopied, setIsCoverLetterCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [isCoverLetterDownloaded, setIsCoverLetterDownloaded] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [isEditingCoverLetter, setIsEditingCoverLetter] = useState(false)
  const [coverLetterDraft, setCoverLetterDraft] = useState(state?.analysis?.coverLetter ?? '')
  const [isSavingCoverLetter, setIsSavingCoverLetter] = useState(false)
  const [coverLetterSaveMessage, setCoverLetterSaveMessage] = useState('')
  const [coverLetterSaveError, setCoverLetterSaveError] = useState('')

  useEffect(() => {
    if (!id) {
      setIsLoading(false)
      return
    }

    void getApplication(id)
      .then((application) => {
        if (application) {
          setAnalysis(application.analysis)
          setCoverLetterDraft(application.analysis.coverLetter)
          setStatus(application.status)
        } else if (!state?.analysis) {
          setAnalysis(undefined)
        }
      })
      .catch(() => {
        if (!state?.analysis) setAnalysis(undefined)
      })
      .finally(() => setIsLoading(false))
  }, [id, state?.analysis])

  async function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    if (!id) return

    const previousStatus = status
    const nextStatus = event.target.value as ApplicationStatus
    setStatus(nextStatus)
    setStatusMessage('')
    setStatusError('')
    setIsSavingStatus(true)

    try {
      await updateApplicationStatus(id, nextStatus)
      setStatusMessage('Status saved.')
    } catch {
      setStatus(previousStatus)
      setStatusError('Status could not be saved. Please try again.')
    } finally {
      setIsSavingStatus(false)
    }
  }

  async function handleDelete() {
    if (!id || !analysis) return

    const shouldDelete = window.confirm(
      `Delete ${analysis.jobTitle} at ${analysis.companyName}? This cannot be undone.`,
    )
    if (!shouldDelete) return

    setDeleteError('')
    setIsDeleting(true)

    try {
      await deleteApplication(id)
      navigate('/', { replace: true })
    } catch {
      setDeleteError('Application could not be deleted. Please try again.')
      setIsDeleting(false)
    }
  }

  async function handleCopyCoverLetter() {
    if (!analysis) return

    setCopyError('')
    setIsCoverLetterCopied(false)

    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable.')
      await navigator.clipboard.writeText(analysis.coverLetter)
      setIsCoverLetterCopied(true)
    } catch {
      setCopyError('Cover letter could not be copied. Please select and copy it manually.')
    }
  }

  function handleDownloadCoverLetter() {
    if (!analysis) return

    setDownloadError('')
    setIsCoverLetterDownloaded(false)

    try {
      const fileName = [
        toFileNamePart(analysis.companyName),
        toFileNamePart(analysis.jobTitle),
        'cover-letter.txt',
      ].join('-')
      const file = new Blob([analysis.coverLetter], { type: 'text/plain;charset=utf-8' })
      const downloadUrl = URL.createObjectURL(file)
      const downloadLink = document.createElement('a')

      downloadLink.href = downloadUrl
      downloadLink.download = fileName
      document.body.append(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      URL.revokeObjectURL(downloadUrl)
      setIsCoverLetterDownloaded(true)
    } catch {
      setDownloadError('Cover letter could not be downloaded. Please try again.')
    }
  }

  function handleEditCoverLetter() {
    if (!analysis) return

    setCoverLetterDraft(analysis.coverLetter)
    setCoverLetterSaveMessage('')
    setCoverLetterSaveError('')
    setIsEditingCoverLetter(true)
  }

  function handleCancelCoverLetterEdit() {
    if (!analysis) return

    setCoverLetterDraft(analysis.coverLetter)
    setCoverLetterSaveError('')
    setIsEditingCoverLetter(false)
  }

  async function handleSaveCoverLetter() {
    if (!id || !analysis) return

    const nextCoverLetter = coverLetterDraft.trim()
    setCoverLetterSaveMessage('')
    setCoverLetterSaveError('')

    if (!nextCoverLetter) {
      setCoverLetterSaveError('Cover letter cannot be empty.')
      return
    }

    setIsSavingCoverLetter(true)

    try {
      await updateApplicationCoverLetter(id, nextCoverLetter)
      setAnalysis({ ...analysis, coverLetter: nextCoverLetter })
      setCoverLetterDraft(nextCoverLetter)
      setIsEditingCoverLetter(false)
      setCoverLetterSaveMessage('Cover letter saved.')
      setIsCoverLetterCopied(false)
      setIsCoverLetterDownloaded(false)
    } catch {
      setCoverLetterSaveError('Cover letter could not be saved. Please try again.')
    } finally {
      setIsSavingCoverLetter(false)
    }
  }

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
        <div className="analysis-heading-actions">
          <Link className="secondary-action" to="/">Back to Dashboard</Link>
          <button
            className="danger-action"
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? 'Deleting…' : 'Delete application'}
          </button>
        </div>
      </div>

      {deleteError && <p className="delete-error" role="alert">{deleteError}</p>}

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

          <div className="status-control">
            <label htmlFor="application-status">Application status</label>
            <select
              id="application-status"
              value={status}
              disabled={isSavingStatus}
              onChange={handleStatusChange}
            >
              {applicationStatuses.map((applicationStatus) => (
                <option key={applicationStatus} value={applicationStatus}>
                  {applicationStatus}
                </option>
              ))}
            </select>
            {isSavingStatus && <p className="status-feedback" role="status">Saving…</p>}
            {!isSavingStatus && statusMessage && (
              <p className="status-feedback status-save-success" role="status">{statusMessage}</p>
            )}
            {statusError && <p className="status-feedback status-save-error" role="alert">{statusError}</p>}
          </div>
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
            <div className="cover-letter-actions">
              {!isEditingCoverLetter && (
                <div className="cover-letter-buttons">
                  <button
                    className="secondary-action cover-letter-action"
                    type="button"
                    onClick={handleEditCoverLetter}
                  >
                    Edit cover letter
                  </button>
                  <button
                    className="secondary-action cover-letter-action"
                    type="button"
                    onClick={handleCopyCoverLetter}
                  >
                    {isCoverLetterCopied ? 'Copied!' : 'Copy cover letter'}
                  </button>
                  <button
                    className="secondary-action cover-letter-action"
                    type="button"
                    onClick={handleDownloadCoverLetter}
                  >
                    {isCoverLetterDownloaded ? 'Downloaded!' : 'Download cover letter'}
                  </button>
                </div>
              )}
              {copyError && <p className="cover-letter-error" role="alert">{copyError}</p>}
              {downloadError && <p className="cover-letter-error" role="alert">{downloadError}</p>}
              {coverLetterSaveMessage && (
                <p className="cover-letter-success" role="status">{coverLetterSaveMessage}</p>
              )}
              {coverLetterSaveError && (
                <p className="cover-letter-error" role="alert">{coverLetterSaveError}</p>
              )}
            </div>
            {isEditingCoverLetter ? (
              <div className="cover-letter-editor">
                <label htmlFor="cover-letter-draft">Cover letter draft</label>
                <textarea
                  id="cover-letter-draft"
                  value={coverLetterDraft}
                  disabled={isSavingCoverLetter}
                  rows={14}
                  onChange={(event) => setCoverLetterDraft(event.target.value)}
                />
                <div className="cover-letter-edit-actions">
                  <button
                    className="primary-action"
                    type="button"
                    disabled={isSavingCoverLetter}
                    onClick={handleSaveCoverLetter}
                  >
                    {isSavingCoverLetter ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    className="secondary-action"
                    type="button"
                    disabled={isSavingCoverLetter}
                    onClick={handleCancelCoverLetterEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="cover-letter-preview">
                <p>{analysis.coverLetter}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

export default AnalysisResultPage
