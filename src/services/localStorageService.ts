import type { ApplicationStatus, SavedApplication } from '../types/application'
import type { JobAnalysis } from '../types/jobAnalysis'
import type { JobDescriptionInput } from '../types/jobApplication'
import type { Profile } from '../types/profile'

const PROFILE_KEY = 'job-assistant.profile.v1'
const APPLICATIONS_KEY = 'job-assistant.applications.v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

export function getProfile(): Profile | null {
  return readJson<Profile | null>(PROFILE_KEY, null)
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function getApplications(): SavedApplication[] {
  return readJson<SavedApplication[]>(APPLICATIONS_KEY, [])
}

export function getApplication(id: string): SavedApplication | undefined {
  return getApplications().find((application) => application.id === id)
}

export function saveApplication(
  input: JobDescriptionInput,
  analysis: JobAnalysis,
): SavedApplication {
  const application: SavedApplication = {
    id: crypto.randomUUID(),
    companyName: analysis.companyName,
    jobTitle: analysis.jobTitle,
    matchScore: analysis.matchScore,
    status: 'Draft',
    createdAt: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date()),
    analysis,
    jobDescription: input.jobDescription,
    resumeText: input.resumeText,
  }

  localStorage.setItem(
    APPLICATIONS_KEY,
    JSON.stringify([application, ...getApplications()]),
  )

  return application
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): void {
  const applications = getApplications()
  const applicationIndex = applications.findIndex((application) => application.id === id)

  if (applicationIndex === -1) throw new Error('Application not found.')

  applications[applicationIndex] = {
    ...applications[applicationIndex],
    status,
  }
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications))
}
