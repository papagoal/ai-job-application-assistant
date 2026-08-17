import { useState, type ChangeEvent, type FormEvent } from 'react'
import type { Profile } from '../types/profile'

const initialProfile: Profile = {
  fullName: '',
  email: '',
  professionalSummary: '',
  resumeText: '',
}

type ProfileErrors = Partial<Record<keyof Profile, string>>

function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [isSaved, setIsSaved] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const field = event.target.name as keyof Profile

    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: event.target.value,
    }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    setIsSaved(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: ProfileErrors = {}

    if (!profile.fullName.trim()) nextErrors.fullName = 'Enter your full name.'
    if (!profile.email.trim()) nextErrors.email = 'Enter your email address.'
    if (!profile.resumeText.trim()) nextErrors.resumeText = 'Paste your resume text.'

    setErrors(nextErrors)
    setIsSaved(Object.keys(nextErrors).length === 0)
  }

  return (
    <section className="form-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Candidate profile</p>
          <h1>Profile and resume</h1>
          <p className="page-description">
            Add reusable information that will be compared with future job descriptions.
          </p>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <div className="form-section-heading">
            <h2>Personal details</h2>
            <p>Tell employers who you are and how they can contact you.</p>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={profile.fullName}
                onChange={handleChange}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              />
              {errors.fullName && <p className="field-error" id="fullName-error">{errors.fullName}</p>}
            </div>

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && <p className="field-error" id="email-error">{errors.email}</p>}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="professionalSummary">Professional summary</label>
            <textarea
              id="professionalSummary"
              name="professionalSummary"
              rows={4}
              value={profile.professionalSummary}
              onChange={handleChange}
              placeholder="Summarize your experience, strengths, and career goals."
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <h2>Resume</h2>
            <p>Paste the plain-text version of your resume below.</p>
          </div>

          <div className="form-field">
            <label htmlFor="resumeText">Resume text</label>
            <textarea
              id="resumeText"
              name="resumeText"
              rows={14}
              value={profile.resumeText}
              onChange={handleChange}
              aria-invalid={Boolean(errors.resumeText)}
              aria-describedby={errors.resumeText ? 'resumeText-error' : 'resumeText-hint'}
              placeholder="Paste your work experience, education, skills, and projects."
            />
            <p className="field-hint" id="resumeText-hint">
              File upload and document parsing will be added later.
            </p>
            {errors.resumeText && <p className="field-error" id="resumeText-error">{errors.resumeText}</p>}
          </div>
        </div>

        <div className="form-actions">
          {isSaved && (
            <p className="save-message" role="status">
              Profile is valid. Persistent saving will be added later.
            </p>
          )}
          <button className="submit-button" type="submit">Save profile</button>
        </div>
      </form>
    </section>
  )
}

export default ProfilePage
