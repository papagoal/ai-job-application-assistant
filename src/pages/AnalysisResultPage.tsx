import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  deleteApplication,
  getApplication,
  getProfile,
  updateApplicationCoverLetter,
  updateApplicationNotes,
  updateApplicationStatus,
  updateApplicationTailoredResume,
} from '../services/persistenceService'
import type { ApplicationStatus } from '../types/application'
import type { JobAnalysis } from '../types/jobAnalysis'

interface AnalysisLocationState {
  analysis?: JobAnalysis
}

const applicationStatuses: ApplicationStatus[] = [
  'Draft',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]

function toFileNamePart(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    || 'application'
}

function isSectionHeading(value: string) {
  const heading = value.trim()
  return heading.length > 0
    && heading.length <= 60
    && heading === heading.toUpperCase()
    && /[A-Z]/.test(heading)
}

function TailoredResumeContent({ content }: { content: string }) {
  const blocks = content.trim().split(/\n\s*\n/)

  return blocks.flatMap((block, blockIndex) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const elements: ReactNode[] = []
    const firstLine = lines[0]
    const startsWithHeading = isSectionHeading(firstLine)

    if (startsWithHeading) {
      elements.push(<h3 key={`heading-${blockIndex}`}>{firstLine}</h3>)
      lines.shift()
    }

    if (lines.length && lines.every((line) => /^[-*•]\s+/.test(line))) {
      elements.push(
        <ul key={`list-${blockIndex}`}>
          {lines.map((line, lineIndex) => (
            <li key={`${line}-${lineIndex}`}>{line.replace(/^[-*•]\s+/, '')}</li>
          ))}
        </ul>,
      )
    } else if (lines.length) {
      elements.push(<p key={`paragraph-${blockIndex}`}>{lines.join('\n')}</p>)
    }

    return elements
  })
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
  const [isTailoredResumeCopied, setIsTailoredResumeCopied] = useState(false)
  const [tailoredResumeCopyError, setTailoredResumeCopyError] = useState('')
  const [isTailoredResumeDownloaded, setIsTailoredResumeDownloaded] = useState(false)
  const [tailoredResumeDownloadError, setTailoredResumeDownloadError] = useState('')
  const [isEditingTailoredResume, setIsEditingTailoredResume] = useState(false)
  const [tailoredResumeDraft, setTailoredResumeDraft] = useState(
    state?.analysis?.tailoredResume ?? '',
  )
  const [isSavingTailoredResume, setIsSavingTailoredResume] = useState(false)
  const [tailoredResumeSaveMessage, setTailoredResumeSaveMessage] = useState('')
  const [tailoredResumeSaveError, setTailoredResumeSaveError] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [candidatePhone, setCandidatePhone] = useState('')
  const [candidateLocation, setCandidateLocation] = useState('')
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [savedNotes, setSavedNotes] = useState('')
  const [notesDraft, setNotesDraft] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [notesSaveMessage, setNotesSaveMessage] = useState('')
  const [notesSaveError, setNotesSaveError] = useState('')

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
          setTailoredResumeDraft(application.analysis.tailoredResume ?? '')
          setStatus(application.status)
          setSavedNotes(application.notes ?? '')
          setNotesDraft(application.notes ?? '')
        } else if (!state?.analysis) {
          setAnalysis(undefined)
        }
      })
      .catch(() => {
        if (!state?.analysis) setAnalysis(undefined)
      })
      .finally(() => setIsLoading(false))
  }, [id, state?.analysis])

  useEffect(() => {
    void getProfile()
      .then((profile) => {
        setCandidateName(profile?.fullName.trim() ?? '')
        setCandidateEmail(profile?.email.trim() ?? '')
        setCandidatePhone(profile?.phone.trim() ?? '')
        setCandidateLocation(profile?.location.trim() ?? '')
      })
      .catch(() => undefined)
      .finally(() => setIsProfileLoading(false))
  }, [])

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

  function handlePrint(target: 'cover-letter' | 'tailored-resume') {
    document.body.dataset.printTarget = target
    window.addEventListener(
      'afterprint',
      () => delete document.body.dataset.printTarget,
      { once: true },
    )
    window.print()
  }

  function handlePrintCoverLetter() {
    handlePrint('cover-letter')
  }

  function handlePrintTailoredResume() {
    if (!candidateName || !candidateEmail) return
    handlePrint('tailored-resume')
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

  async function handleCopyTailoredResume() {
    if (!analysis?.tailoredResume) return

    setTailoredResumeCopyError('')
    setIsTailoredResumeCopied(false)

    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable.')
      await navigator.clipboard.writeText(analysis.tailoredResume)
      setIsTailoredResumeCopied(true)
    } catch {
      setTailoredResumeCopyError(
        'Tailored resume could not be copied. Please select and copy it manually.',
      )
    }
  }

  function handleDownloadTailoredResume() {
    if (!analysis?.tailoredResume) return

    setTailoredResumeDownloadError('')
    setIsTailoredResumeDownloaded(false)

    try {
      const fileName = [
        toFileNamePart(analysis.companyName),
        toFileNamePart(analysis.jobTitle),
        'tailored-resume.txt',
      ].join('-')
      const file = new Blob([analysis.tailoredResume], {
        type: 'text/plain;charset=utf-8',
      })
      const downloadUrl = URL.createObjectURL(file)
      const downloadLink = document.createElement('a')

      downloadLink.href = downloadUrl
      downloadLink.download = fileName
      document.body.append(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      URL.revokeObjectURL(downloadUrl)
      setIsTailoredResumeDownloaded(true)
    } catch {
      setTailoredResumeDownloadError(
        'Tailored resume could not be downloaded. Please try again.',
      )
    }
  }

  function handleEditTailoredResume() {
    if (!analysis?.tailoredResume) return

    setTailoredResumeDraft(analysis.tailoredResume)
    setTailoredResumeSaveMessage('')
    setTailoredResumeSaveError('')
    setIsEditingTailoredResume(true)
  }

  function handleCancelTailoredResumeEdit() {
    if (!analysis?.tailoredResume) return

    setTailoredResumeDraft(analysis.tailoredResume)
    setTailoredResumeSaveError('')
    setIsEditingTailoredResume(false)
  }

  async function handleSaveTailoredResume() {
    if (!id || !analysis) return

    const nextTailoredResume = tailoredResumeDraft.trim()
    setTailoredResumeSaveMessage('')
    setTailoredResumeSaveError('')

    if (!nextTailoredResume) {
      setTailoredResumeSaveError('Tailored resume cannot be empty.')
      return
    }

    setIsSavingTailoredResume(true)

    try {
      await updateApplicationTailoredResume(id, nextTailoredResume)
      setAnalysis({ ...analysis, tailoredResume: nextTailoredResume })
      setTailoredResumeDraft(nextTailoredResume)
      setIsEditingTailoredResume(false)
      setTailoredResumeSaveMessage('Tailored resume saved.')
      setIsTailoredResumeCopied(false)
      setIsTailoredResumeDownloaded(false)
    } catch {
      setTailoredResumeSaveError(
        'Tailored resume could not be saved. Please try again.',
      )
    } finally {
      setIsSavingTailoredResume(false)
    }
  }

  async function handleSaveNotes() {
    if (!id) return

    const nextNotes = notesDraft.trim()
    setNotesSaveMessage('')
    setNotesSaveError('')
    setIsSavingNotes(true)

    try {
      await updateApplicationNotes(id, nextNotes)
      setSavedNotes(nextNotes)
      setNotesDraft(nextNotes)
      setNotesSaveMessage('Notes saved.')
    } catch {
      setNotesSaveError('Notes could not be saved. Please try again.')
    } finally {
      setIsSavingNotes(false)
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

          <section className="analysis-panel tailored-resume-panel">
            <div className="analysis-panel-heading">
              <div>
                <p className="analysis-label">Tailored resume</p>
                <h2>Job-targeted draft</h2>
              </div>
            </div>
            {analysis.tailoredResume ? (
              <>
                <div className="tailored-resume-actions">
                  {!isEditingTailoredResume && (
                    <div className="tailored-resume-buttons">
                      <button
                        className="secondary-action tailored-resume-action"
                        type="button"
                        onClick={handleEditTailoredResume}
                      >
                        Edit tailored resume
                      </button>
                      <button
                        className="secondary-action tailored-resume-action"
                        type="button"
                        onClick={handleCopyTailoredResume}
                      >
                        {isTailoredResumeCopied ? 'Copied!' : 'Copy tailored resume'}
                      </button>
                      <button
                        className="secondary-action tailored-resume-action"
                        type="button"
                        onClick={handleDownloadTailoredResume}
                      >
                        {isTailoredResumeDownloaded
                          ? 'Downloaded!'
                          : 'Download tailored resume'}
                      </button>
                      <button
                        className="secondary-action tailored-resume-action"
                        type="button"
                        disabled={isProfileLoading || !candidateName || !candidateEmail}
                        onClick={handlePrintTailoredResume}
                      >
                        Print / Save as PDF
                      </button>
                    </div>
                  )}
                  {!isProfileLoading && (!candidateName || !candidateEmail) && (
                    <p className="tailored-resume-profile-warning" role="alert">
                      Add your name and email in <Link to="/profile">Profile</Link> before
                      saving this resume as a PDF.
                    </p>
                  )}
                  {tailoredResumeCopyError && (
                    <p className="tailored-resume-error" role="alert">
                      {tailoredResumeCopyError}
                    </p>
                  )}
                  {tailoredResumeDownloadError && (
                    <p className="tailored-resume-error" role="alert">
                      {tailoredResumeDownloadError}
                    </p>
                  )}
                  {tailoredResumeSaveMessage && (
                    <p className="tailored-resume-success" role="status">
                      {tailoredResumeSaveMessage}
                    </p>
                  )}
                  {tailoredResumeSaveError && (
                    <p className="tailored-resume-error" role="alert">
                      {tailoredResumeSaveError}
                    </p>
                  )}
                </div>
                {isEditingTailoredResume ? (
                  <div className="tailored-resume-editor">
                    <label htmlFor="tailored-resume-draft">Tailored resume draft</label>
                    <textarea
                      id="tailored-resume-draft"
                      value={tailoredResumeDraft}
                      disabled={isSavingTailoredResume}
                      rows={18}
                      onChange={(event) => setTailoredResumeDraft(event.target.value)}
                    />
                    <div className="tailored-resume-edit-actions">
                      <button
                        className="primary-action"
                        type="button"
                        disabled={isSavingTailoredResume}
                        onClick={handleSaveTailoredResume}
                      >
                        {isSavingTailoredResume ? 'Saving…' : 'Save tailored resume'}
                      </button>
                      <button
                        className="secondary-action"
                        type="button"
                        disabled={isSavingTailoredResume}
                        onClick={handleCancelTailoredResumeEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="tailored-resume-preview">
                    <article className="tailored-resume-document">
                      <header className="tailored-resume-document-header">
                        <h1>{candidateName || 'Complete your profile'}</h1>
                        <div className="tailored-resume-contact-details">
                          {candidateEmail ? (
                            <a href={`mailto:${candidateEmail}`}>{candidateEmail}</a>
                          ) : (
                            <span>Add your email to Profile</span>
                          )}
                          {candidatePhone && <a href={`tel:${candidatePhone}`}>{candidatePhone}</a>}
                          {candidateLocation && <span>{candidateLocation}</span>}
                        </div>
                      </header>
                      <TailoredResumeContent content={analysis.tailoredResume} />
                    </article>
                  </div>
                )}
              </>
            ) : (
              <p className="tailored-resume-unavailable">
                This application was created before tailored resume drafts were
                available. Create a new analysis to generate one.
              </p>
            )}
          </section>

          <section className="analysis-panel cover-letter-panel">
            <div className="print-cover-letter-heading">
              <p>Cover letter</p>
              <h1>{analysis.jobTitle}</h1>
              <p>{analysis.companyName}</p>
            </div>
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
                  <button
                    className="secondary-action cover-letter-action"
                    type="button"
                    onClick={handlePrintCoverLetter}
                  >
                    Print / Save as PDF
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

          <section className="analysis-panel">
            <div className="analysis-panel-heading">
              <div>
                <p className="analysis-label">Application notes</p>
                <h2>Private notes</h2>
              </div>
            </div>
            <div className="notes-editor">
              <label htmlFor="application-notes">Notes</label>
              <textarea
                id="application-notes"
                value={notesDraft}
                disabled={isSavingNotes}
                rows={7}
                placeholder="Add contacts, follow-ups, interview feedback, or next steps."
                onChange={(event) => {
                  setNotesDraft(event.target.value)
                  setNotesSaveMessage('')
                  setNotesSaveError('')
                }}
              />
              <div className="notes-actions">
                <button
                  className="primary-action"
                  type="button"
                  disabled={isSavingNotes || notesDraft === savedNotes}
                  onClick={handleSaveNotes}
                >
                  {isSavingNotes ? 'Saving…' : 'Save notes'}
                </button>
                {notesSaveMessage && (
                  <p className="notes-success" role="status">{notesSaveMessage}</p>
                )}
                {notesSaveError && (
                  <p className="notes-error" role="alert">{notesSaveError}</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default AnalysisResultPage
