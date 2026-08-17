import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { JobDescriptionInput } from '../types/jobApplication'

const initialJobDescription: JobDescriptionInput = {
  companyName: '',
  jobTitle: '',
  jobDescription: '',
}

type JobDescriptionErrors = Partial<Record<keyof JobDescriptionInput, string>>

function NewApplicationPage() {
  const [job, setJob] = useState(initialJobDescription)
  const [errors, setErrors] = useState<JobDescriptionErrors>({})
  const [isReady, setIsReady] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const field = event.target.name as keyof JobDescriptionInput

    setJob((currentJob) => ({
      ...currentJob,
      [field]: event.target.value,
    }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    setIsReady(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: JobDescriptionErrors = {}

    if (!job.companyName.trim()) nextErrors.companyName = 'Enter the company name.'
    if (!job.jobTitle.trim()) nextErrors.jobTitle = 'Enter the job title.'
    if (!job.jobDescription.trim()) {
      nextErrors.jobDescription = 'Paste the job description.'
    }

    setErrors(nextErrors)
    setIsReady(Object.keys(nextErrors).length === 0)
  }

  return (
    <section className="form-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">New application</p>
          <h1>Add a job description</h1>
          <p className="page-description">
            Add the role you want to compare with your saved profile and resume.
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

        <div className="form-actions form-actions-between">
          <Link className="secondary-action" to="/">Cancel</Link>
          <div className="form-submit-group">
            {isReady && (
              <p className="save-message" role="status">
                Job details are ready. Analysis will be connected next.
              </p>
            )}
            <button className="submit-button" type="submit">Analyze match</button>
          </div>
        </div>
      </form>
    </section>
  )
}

export default NewApplicationPage
