import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { analyzeJob } from '../services/jobAnalysisService'
import { getProfile, saveApplication } from '../services/persistenceService'
import type { JobDescriptionInput } from '../types/jobApplication'

const initialJobDescription: JobDescriptionInput = {
  companyName: '',
  jobTitle: '',
  jobDescription: '',
  resumeText: '',
  outputLanguage: 'en',
}

type JobDescriptionErrors = Partial<Record<keyof JobDescriptionInput, string>>

function NewApplicationPage() {
  const navigate = useNavigate()
  const [job, setJob] = useState(initialJobDescription)
  const [errors, setErrors] = useState<JobDescriptionErrors>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [submissionError, setSubmissionError] = useState('')

  useEffect(() => {
    void getProfile()
      .then((profile) => {
        if (profile?.resumeText) {
          setJob((currentJob) => ({ ...currentJob, resumeText: profile.resumeText }))
        }
      })
      .catch(() => undefined)
  }, [])

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const field = event.target.name as keyof JobDescriptionInput

    setJob((currentJob) => ({
      ...currentJob,
      [field]: event.target.value,
    }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    setSubmissionError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: JobDescriptionErrors = {}

    if (!job.companyName.trim()) nextErrors.companyName = 'Enter the company name.'
    if (!job.jobTitle.trim()) nextErrors.jobTitle = 'Enter the job title.'
    if (!job.jobDescription.trim()) {
      nextErrors.jobDescription = 'Paste the job description.'
    }
    if (!job.resumeText.trim()) nextErrors.resumeText = 'Paste your resume text.'

    setErrors(nextErrors)
    setSubmissionError('')

    if (Object.keys(nextErrors).length > 0) return

    setIsAnalyzing(true)

    try {
      const analysis = await analyzeJob(job)
      const application = await saveApplication(job, analysis)

      navigate(`/applications/${application.id}`, {
        state: { analysis },
      })
    } catch {
      setSubmissionError(
        'We could not analyze this application. Please check your connection and try again.',
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <section className="form-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">New application</p>
          <h1>Add application details</h1>
          <p className="page-description">
            Add the role and resume you want to compare in this analysis.
          </p>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <div className="form-section-heading">
            <h2>Role details</h2>
            <p>Enter the company and position exactly as they appear in the listing.</p>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="companyName">Company name</label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={job.companyName}
                onChange={handleChange}
                aria-invalid={Boolean(errors.companyName)}
                aria-describedby={errors.companyName ? 'companyName-error' : undefined}
                placeholder="Northstar Labs"
              />
              {errors.companyName && (
                <p className="field-error" id="companyName-error">{errors.companyName}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="jobTitle">Job title</label>
              <input
                id="jobTitle"
                name="jobTitle"
                type="text"
                value={job.jobTitle}
                onChange={handleChange}
                aria-invalid={Boolean(errors.jobTitle)}
                aria-describedby={errors.jobTitle ? 'jobTitle-error' : undefined}
                placeholder="Frontend Developer"
              />
              {errors.jobTitle && (
                <p className="field-error" id="jobTitle-error">{errors.jobTitle}</p>
              )}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="outputLanguage">AI output language</label>
            <select
              id="outputLanguage"
              name="outputLanguage"
              value={job.outputLanguage ?? 'en'}
              onChange={handleChange}
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
            <p className="field-hint">
              Controls the language used for the analysis, tailored resume, and cover letter.
            </p>
          </div>

          <div className="form-field">
            <label htmlFor="jobDescription">Job description</label>
            <textarea
              id="jobDescription"
              name="jobDescription"
              rows={16}
              value={job.jobDescription}
              onChange={handleChange}
              aria-invalid={Boolean(errors.jobDescription)}
              aria-describedby={errors.jobDescription ? 'jobDescription-error' : 'jobDescription-count'}
              placeholder="Paste the complete job description, including responsibilities and requirements."
            />
            <div className="field-details">
              <p className="field-hint">Include skills and qualifications for a more useful analysis.</p>
              <p className="character-count" id="jobDescription-count">
                {job.jobDescription.length.toLocaleString()} characters
              </p>
            </div>
            {errors.jobDescription && (
              <p className="field-error" id="jobDescription-error">{errors.jobDescription}</p>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <h2>Resume</h2>
            <p>Paste the resume text that should be compared with this job.</p>
          </div>

          <div className="form-field">
            <label htmlFor="resumeText">Resume text</label>
            <textarea
              id="resumeText"
              name="resumeText"
              rows={14}
              value={job.resumeText}
              onChange={handleChange}
              aria-invalid={Boolean(errors.resumeText)}
              aria-describedby={errors.resumeText ? 'resumeText-error' : 'resumeText-count'}
              placeholder="Paste your work experience, education, skills, and projects."
            />
            <div className="field-details">
              <p className="field-hint">
                Loaded from your saved profile when one is available.
              </p>
              <p className="character-count" id="resumeText-count">
                {job.resumeText.length.toLocaleString()} characters
              </p>
            </div>
            {errors.resumeText && (
              <p className="field-error" id="resumeText-error">{errors.resumeText}</p>
            )}
          </div>
        </div>

        <div className="form-actions form-actions-between">
          <Link className="secondary-action" to="/">Cancel</Link>
          <div className="form-submit-group">
            {submissionError && (
              <p className="submission-error" role="alert">{submissionError}</p>
            )}
            <button
              className="submit-button"
              type="submit"
              disabled={isAnalyzing}
              aria-busy={isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing…' : 'Analyze match'}
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

export default NewApplicationPage
