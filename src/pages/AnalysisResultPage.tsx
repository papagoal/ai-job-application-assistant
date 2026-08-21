import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { regenerateTailoredResume } from '../services/jobAnalysisService'
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

interface ResumePdfBlock {
  type: 'heading' | 'paragraph' | 'bullet'
  text: string
}

const applicationStatuses: ApplicationStatus[] = [
  'Draft',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]

const chineseResumeSectionHeadings = new Set([
  '专业摘要',
  '核心技能',
  '技术技能',
  '专业技能',
  '技能专长',
  '工作经历',
  '工作经验',
  '职业经历',
  '项目经历',
  '项目经验',
  '教育背景',
  '教育经历',
  '证书与认证',
  '语言能力',
  '目标职位',
])

function toFileNamePart(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    || 'application'
}

function isSectionHeading(value: string) {
  const heading = value.trim()
  return chineseResumeSectionHeadings.has(heading.replace(/:$/, ''))
    || (heading.length > 0
    && heading.length <= 60
    && heading === heading.toUpperCase()
    && /[A-Z]/.test(heading))
}

function toResumePdfBlocks(content: string): ResumePdfBlock[] {
  return content.trim().split(/\n\s*\n/).flatMap((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const blocks: ResumePdfBlock[] = []

    if (lines.length > 0 && isSectionHeading(lines[0])) {
      blocks.push({ type: 'heading', text: lines.shift() ?? '' })
    }

    if (lines.length > 0 && lines.every((line) => /^[-*•]\s+/.test(line))) {
      blocks.push(...lines.map((line) => ({
        type: 'bullet' as const,
        text: line.replace(/^[-*•]\s+/, ''),
      })))
    } else if (lines.length > 0) {
      blocks.push({ type: 'paragraph', text: lines.join(' ') })
    }

    return blocks
  })
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
  const [isDownloadingTailoredResume, setIsDownloadingTailoredResume] = useState(false)
  const [tailoredResumeDownloadError, setTailoredResumeDownloadError] = useState('')
  const [isEditingTailoredResume, setIsEditingTailoredResume] = useState(false)
  const [tailoredResumeDraft, setTailoredResumeDraft] = useState(
    state?.analysis?.tailoredResume ?? '',
  )
  const [isSavingTailoredResume, setIsSavingTailoredResume] = useState(false)
  const [tailoredResumeSaveMessage, setTailoredResumeSaveMessage] = useState('')
  const [tailoredResumeSaveError, setTailoredResumeSaveError] = useState('')
  const [sourceJobDescription, setSourceJobDescription] = useState('')
  const [sourceResumeText, setSourceResumeText] = useState('')
  const [isRegeneratingTailoredResume, setIsRegeneratingTailoredResume] = useState(false)
  const [isUndoingTailoredResume, setIsUndoingTailoredResume] = useState(false)
  const [tailoredResumeRegenerationError, setTailoredResumeRegenerationError] = useState('')
  const [previousTailoredResume, setPreviousTailoredResume] = useState<string | null>(null)
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
          setSourceJobDescription(application.jobDescription)
          setSourceResumeText(application.resumeText)
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

  async function handleDownloadTailoredResume() {
    if (!analysis?.tailoredResume || !candidateName || !candidateEmail) return

    setTailoredResumeDownloadError('')
    setIsTailoredResumeDownloaded(false)
    setIsDownloadingTailoredResume(true)

    try {
      const fileName = [
        toFileNamePart(analysis.companyName),
        toFileNamePart(analysis.jobTitle),
        'tailored-resume.pdf',
      ].join('-')
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      if (analysis.outputLanguage === 'zh') {
        const resumeDocument = document.getElementById('tailored-resume-document')
        if (!(resumeDocument instanceof HTMLElement)) {
          throw new Error('Tailored resume preview is unavailable.')
        }

        const { default: html2canvas } = await import('html2canvas')
        const renderDocument = resumeDocument.cloneNode(true) as HTMLElement
        Object.assign(renderDocument.style, {
          position: 'fixed',
          top: '0',
          left: '-10000px',
          width: '760px',
          maxWidth: 'none',
          margin: '0',
          padding: '36px',
          boxSizing: 'border-box',
          background: '#ffffff',
        })
        document.body.append(renderDocument)

        try {
          const canvas = await html2canvas(renderDocument, {
            backgroundColor: '#ffffff',
            logging: false,
            scale: 2,
          })
          const margin = 18
          const availableWidth = pageWidth - (margin * 2)
          const availableHeight = pageHeight - (margin * 2)
          const imageScale = Math.min(
            availableWidth / canvas.width,
            availableHeight / canvas.height,
          )
          const imageWidth = canvas.width * imageScale
          const imageHeight = canvas.height * imageScale

          pdf.setProperties({
            title: `${candidateName} - ${analysis.jobTitle}`,
            subject: `Tailored resume for ${analysis.jobTitle} at ${analysis.companyName}`,
          })
          pdf.addImage(
            canvas.toDataURL('image/png'),
            'PNG',
            (pageWidth - imageWidth) / 2,
            margin,
            imageWidth,
            imageHeight,
          )
          pdf.save(fileName)
          setIsTailoredResumeDownloaded(true)
          return
        } finally {
          renderDocument.remove()
        }
      }

      const margin = 40
      const contentWidth = pageWidth - (margin * 2)
      const contentBottom = pageHeight - margin
      const contentStart = 88
      const blocks = toResumePdfBlocks(analysis.tailoredResume)
      const contactDetails = [candidateEmail, candidatePhone, candidateLocation]
        .filter(Boolean)
        .join('  |  ')

      pdf.setProperties({
        title: `${candidateName} - ${analysis.jobTitle}`,
        subject: `Tailored resume for ${analysis.jobTitle} at ${analysis.companyName}`,
      })
      pdf.setTextColor('#101828')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(22)
      pdf.text(candidateName, pageWidth / 2, 45, { align: 'center' })
      pdf.setFont('helvetica', 'normal')
      let contactFontSize = 9
      pdf.setFontSize(contactFontSize)
      while (pdf.getTextWidth(contactDetails) > contentWidth && contactFontSize > 7) {
        contactFontSize -= 0.25
        pdf.setFontSize(contactFontSize)
      }
      pdf.setTextColor('#475467')
      pdf.text(contactDetails, pageWidth / 2, 64, { align: 'center' })
      pdf.setDrawColor('#3157d5')
      pdf.setLineWidth(1.5)
      pdf.line(margin, 77, pageWidth - margin, 77)

      const measureBlocks = (
        fontSize: number,
        lineHeightFactor: number,
        extraBlockSpacing = 0,
      ) => blocks.reduce((height, block) => {
        if (block.type === 'heading') {
          const headingFontSize = Math.max(9.5, fontSize * 0.92)
          return height
            + (fontSize * 0.85)
            + (headingFontSize * 1.6)
            + extraBlockSpacing
        }
        const prefix = block.type === 'bullet' ? '- ' : ''
        pdf.setFont('times', 'normal')
        pdf.setFontSize(fontSize)
        const lines = pdf.splitTextToSize(`${prefix}${block.text}`, contentWidth) as string[]
        const blockSpacing = block.type === 'bullet' ? fontSize * 0.2 : fontSize * 0.55
        return height
          + (lines.length * fontSize * lineHeightFactor)
          + blockSpacing
          + extraBlockSpacing
      }, 0)

      const baseLineHeightFactor = 1.32
      const availableContentHeight = contentBottom - contentStart
      let bodyFontSize = 12.5
      while (
        measureBlocks(bodyFontSize, baseLineHeightFactor) > availableContentHeight
        && bodyFontSize > 8.25
      ) {
        bodyFontSize -= 0.25
      }

      const textLineCount = blocks.reduce((count, block) => {
        if (block.type === 'heading') return count
        const prefix = block.type === 'bullet' ? '- ' : ''
        pdf.setFont('times', 'normal')
        pdf.setFontSize(bodyFontSize)
        const lines = pdf.splitTextToSize(`${prefix}${block.text}`, contentWidth) as string[]
        return count + lines.length
      }, 0)
      const targetContentHeight = availableContentHeight * 0.96
      const baseContentHeight = measureBlocks(bodyFontSize, baseLineHeightFactor)
      const lineHeightFactor = Math.min(
        1.5,
        baseLineHeightFactor
          + (Math.max(0, targetContentHeight - baseContentHeight)
            / Math.max(1, textLineCount * bodyFontSize)),
      )
      const contentHeightWithAdjustedLines = measureBlocks(bodyFontSize, lineHeightFactor)
      const extraBlockSpacing = Math.min(
        4,
        Math.max(0, targetContentHeight - contentHeightWithAdjustedLines)
          / Math.max(1, blocks.length),
      )

      let y = contentStart
      for (const block of blocks) {
        if (block.type === 'heading') {
          const headingFontSize = Math.max(9.5, bodyFontSize * 0.92)
          y += bodyFontSize * 0.85
          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(headingFontSize)
          pdf.setTextColor('#2345a4')
          pdf.text(block.text, margin, y)
          y += headingFontSize * 0.65
          pdf.setDrawColor('#d0d5dd')
          pdf.setLineWidth(0.5)
          pdf.line(margin, y, pageWidth - margin, y)
          y += (headingFontSize * 0.95) + extraBlockSpacing
          continue
        }

        const prefix = block.type === 'bullet' ? '- ' : ''
        pdf.setFont('times', 'normal')
        pdf.setFontSize(bodyFontSize)
        pdf.setTextColor('#111827')
        const lines = pdf.splitTextToSize(`${prefix}${block.text}`, contentWidth) as string[]
        pdf.text(lines, margin, y, { lineHeightFactor })
        const blockSpacing = block.type === 'bullet'
          ? bodyFontSize * 0.2
          : bodyFontSize * 0.55
        y += (lines.length * bodyFontSize * lineHeightFactor)
          + blockSpacing
          + extraBlockSpacing
      }

      pdf.save(fileName)
      setIsTailoredResumeDownloaded(true)
    } catch {
      setTailoredResumeDownloadError(
        'Tailored resume PDF could not be downloaded. Please try again.',
      )
    } finally {
      setIsDownloadingTailoredResume(false)
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
      setPreviousTailoredResume(null)
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

  async function handleRegenerateTailoredResume() {
    if (
      !id
      || !analysis?.tailoredResume
      || !sourceJobDescription
      || !sourceResumeText
    ) return

    const currentTailoredResume = analysis.tailoredResume
    setTailoredResumeSaveMessage('')
    setTailoredResumeSaveError('')
    setTailoredResumeRegenerationError('')
    setIsRegeneratingTailoredResume(true)

    try {
      const regeneratedResume = await regenerateTailoredResume({
        companyName: analysis.companyName,
        jobTitle: analysis.jobTitle,
        jobDescription: sourceJobDescription,
        resumeText: sourceResumeText,
        outputLanguage: analysis.outputLanguage ?? 'en',
        currentTailoredResume,
      })

      await updateApplicationTailoredResume(id, regeneratedResume)
      setPreviousTailoredResume(currentTailoredResume)
      setAnalysis((currentAnalysis) => currentAnalysis
        ? { ...currentAnalysis, tailoredResume: regeneratedResume }
        : currentAnalysis)
      setTailoredResumeDraft(regeneratedResume)
      setTailoredResumeSaveMessage('New AI resume generated and saved.')
      setIsTailoredResumeCopied(false)
      setIsTailoredResumeDownloaded(false)
    } catch {
      setTailoredResumeRegenerationError(
        'A new resume could not be generated. Your current resume was kept.',
      )
    } finally {
      setIsRegeneratingTailoredResume(false)
    }
  }

  async function handleUndoTailoredResumeRegeneration() {
    if (!id || !analysis || !previousTailoredResume) return

    setTailoredResumeSaveMessage('')
    setTailoredResumeSaveError('')
    setTailoredResumeRegenerationError('')
    setIsUndoingTailoredResume(true)

    try {
      await updateApplicationTailoredResume(id, previousTailoredResume)
      setAnalysis((currentAnalysis) => currentAnalysis
        ? { ...currentAnalysis, tailoredResume: previousTailoredResume }
        : currentAnalysis)
      setTailoredResumeDraft(previousTailoredResume)
      setPreviousTailoredResume(null)
      setTailoredResumeSaveMessage('Previous resume restored.')
      setIsTailoredResumeCopied(false)
      setIsTailoredResumeDownloaded(false)
    } catch {
      setTailoredResumeRegenerationError(
        'The previous resume could not be restored. Please try again.',
      )
    } finally {
      setIsUndoingTailoredResume(false)
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
                        disabled={isRegeneratingTailoredResume || isUndoingTailoredResume}
                        onClick={handleEditTailoredResume}
                      >
                        Edit tailored resume
                      </button>
                      <button
                        className="secondary-action tailored-resume-action"
                        type="button"
                        disabled={
                          isRegeneratingTailoredResume
                          || isUndoingTailoredResume
                          || !sourceJobDescription
                          || !sourceResumeText
                        }
                        onClick={handleRegenerateTailoredResume}
                      >
                        {isRegeneratingTailoredResume
                          ? 'Regenerating…'
                          : 'Regenerate with AI'}
                      </button>
                      {previousTailoredResume && (
                        <button
                          className="secondary-action tailored-resume-action"
                          type="button"
                          disabled={isRegeneratingTailoredResume || isUndoingTailoredResume}
                          onClick={handleUndoTailoredResumeRegeneration}
                        >
                          {isUndoingTailoredResume ? 'Restoring…' : 'Undo regeneration'}
                        </button>
                      )}
                      <button
                        className="secondary-action tailored-resume-action"
                        type="button"
                        onClick={handleCopyTailoredResume}
                      >
                        {isTailoredResumeCopied ? 'Copied!' : 'Copy as text'}
                      </button>
                      <button
                        className="secondary-action tailored-resume-action"
                        type="button"
                        disabled={
                          isDownloadingTailoredResume
                          || isProfileLoading
                          || !candidateName
                          || !candidateEmail
                        }
                        onClick={handleDownloadTailoredResume}
                      >
                        {isDownloadingTailoredResume
                          ? 'Preparing PDF…'
                          : isTailoredResumeDownloaded
                            ? 'PDF downloaded!'
                            : 'Download PDF'}
                      </button>
                      <button
                        className="secondary-action tailored-resume-action"
                        type="button"
                        disabled={isProfileLoading || !candidateName || !candidateEmail}
                        onClick={handlePrintTailoredResume}
                      >
                        Print
                      </button>
                    </div>
                  )}
                  {!isProfileLoading && (!candidateName || !candidateEmail) && (
                    <p className="tailored-resume-profile-warning" role="alert">
                      Add your name and email in <Link to="/profile">Profile</Link> before
                      downloading or printing this resume.
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
                  {tailoredResumeRegenerationError && (
                    <p className="tailored-resume-error" role="alert">
                      {tailoredResumeRegenerationError}
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
                    <article
                      className="tailored-resume-document"
                      id="tailored-resume-document"
                    >
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
