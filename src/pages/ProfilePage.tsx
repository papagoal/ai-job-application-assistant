import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { getProfile, saveProfile } from '../services/persistenceService'
import type { Profile } from '../types/profile'

const initialProfile: Profile = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  professionalSummary: '',
  resumeText: '',
}

type ProfileErrors = Partial<Record<keyof Profile, string>>

function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    void getProfile()
      .then((savedProfile) => {
        if (savedProfile) setProfile(savedProfile)
      })
      .catch(() => setSaveError('Your saved profile could not be loaded.'))
  }, [])

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const field = event.target.name as keyof Profile

    setProfile((currentProfile) => ({
      ...currentProfile,
      [field]: event.target.value,
    }))
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }))
    setIsSaved(false)
    setSaveError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: ProfileErrors = {}

    if (!profile.fullName.trim()) nextErrors.fullName = 'Enter your full name.'
    if (!profile.email.trim()) nextErrors.email = 'Enter your email address.'
    if (!profile.resumeText.trim()) nextErrors.resumeText = 'Paste your resume text.'

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      setIsSaving(true)
      setSaveError('')
      try {
        await saveProfile(profile)
        setIsSaved(true)
      } catch {
        setSaveError('Your profile could not be saved. Please try again.')
      } finally {
        setIsSaving(false)
      }
    }
  }

  return (
    <section className="form-page profile-page">
      <div className="page-heading profile-page-heading">
        <div>
          <p className="eyebrow">Career workspace</p>
          <h1>Profile and resume</h1>
          <p className="page-description">
            Add reusable information that will be compared with future job descriptions.
          </p>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit} noValidate>
        <div className="form-section profile-section">
          <div className="profile-section-header">
            <span className="profile-section-index" aria-hidden="true">01</span>
            <div className="form-section-heading">
              <h2>Personal details</h2>
              <p>Tell employers who you are and how they can contact you.</p>
            </div>
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

            <div className="form-field">
              <label htmlFor="phone">Phone <span className="optional-label">Optional</span></label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={profile.phone}
                onChange={handleChange}
                placeholder="+1 416 555 0123"
              />
            </div>

            <div className="form-field">
              <label htmlFor="location">Location <span className="optional-label">Optional</span></label>
              <input
                id="location"
                name="location"
                type="text"
                autoComplete="address-level2"
                value={profile.location}
                onChange={handleChange}
                placeholder="Toronto, ON"
              />
            </div>
          </div>

          <div className="form-field profile-summary-field">
            <label htmlFor="professionalSummary">Professional summary</label>
            <textarea
              id="professionalSummary"
              name="professionalSummary"
              rows={4}
              value={profile.professionalSummary}
              onChange={handleChange}
              placeholder="Summarize your experience, strengths, and career goals."
            />
            <div className="field-details">
              <p className="field-hint">Keep this concise. AI will tailor it for each role.</p>
              <p className="character-count" aria-live="polite">
                {profile.professionalSummary.length.toLocaleString()} characters
              </p>
            </div>
          </div>
        </div>

        <div className="form-section profile-section profile-resume-section">
          <div className="profile-section-header">
            <span className="profile-section-index" aria-hidden="true">02</span>
            <div className="form-section-heading">
              <h2>Source resume</h2>
              <p>Paste the plain-text version that AI should use as verified source material.</p>
            </div>
          </div>

          <div className="form-field profile-resume-field">
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
            <div className="field-details">
              <p className="field-hint" id="resumeText-hint">
                This resume will be prefilled when you create a new application.
              </p>
              <p className="character-count" aria-live="polite">
                {profile.resumeText.length.toLocaleString()} characters
              </p>
            </div>
            {errors.resumeText && <p className="field-error" id="resumeText-error">{errors.resumeText}</p>}
          </div>
        </div>

        <div className="form-actions profile-form-actions">
          <div className="profile-save-feedback">
            {isSaved && (
              <p className="save-message" role="status">
                Profile saved.
              </p>
            )}
            {saveError && <p className="submission-error" role="alert">{saveError}</p>}
          </div>
          <button className="submit-button" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ProfilePage
