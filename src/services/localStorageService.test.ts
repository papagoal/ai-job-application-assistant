import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockJobAnalysis } from '../mocks/jobAnalysis'
import type { JobDescriptionInput } from '../types/jobApplication'
import type { Profile } from '../types/profile'
import {
  deleteApplication,
  getApplication,
  getApplications,
  getProfile,
  saveApplication,
  saveProfile,
  updateApplicationCoverLetter,
  updateApplicationNotes,
  updateApplicationStatus,
  updateApplicationTailoredResume,
} from './localStorageService'

const APPLICATIONS_KEY = 'job-assistant.applications.v1'
const APPLICATION_ID = '00000000-0000-4000-8000-000000000001'

const input: JobDescriptionInput = {
  companyName: 'Northstar Labs',
  jobTitle: 'Frontend Developer',
  jobDescription: 'Build accessible React applications.',
  resumeText: 'Frontend developer with React and TypeScript experience.',
}

const profile: Profile = {
  fullName: 'Test Candidate',
  email: 'candidate@example.com',
  phone: '+1 416 555 0123',
  location: 'Toronto, ON',
  professionalSummary: 'Frontend developer',
  resumeText: input.resumeText,
}

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function createApplication() {
  return saveApplication(input, mockJobAnalysis)
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage())
  vi.stubGlobal('crypto', {
    randomUUID: () => APPLICATION_ID,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('profile persistence', () => {
  it('saves and retrieves a profile', () => {
    expect(getProfile()).toBeNull()

    saveProfile(profile)

    expect(getProfile()).toEqual(profile)
  })

  it('normalizes legacy profiles without optional contact fields', () => {
    const legacyProfile = { ...profile } as Partial<Profile>
    delete legacyProfile.phone
    delete legacyProfile.location
    localStorage.setItem('job-assistant.profile.v1', JSON.stringify(legacyProfile))

    expect(getProfile()).toEqual({ ...profile, phone: '', location: '' })
  })
})

describe('application persistence', () => {
  it('saves a new application with safe defaults', () => {
    const application = createApplication()

    expect(application).toMatchObject({
      id: APPLICATION_ID,
      companyName: mockJobAnalysis.companyName,
      jobTitle: mockJobAnalysis.jobTitle,
      matchScore: mockJobAnalysis.matchScore,
      status: 'Draft',
      jobDescription: input.jobDescription,
      resumeText: input.resumeText,
      notes: '',
    })
    expect(application.createdAt).not.toBe('')
    expect(getApplications()).toEqual([application])
  })

  it('updates an application status', () => {
    createApplication()

    updateApplicationStatus(APPLICATION_ID, 'Interview')

    expect(getApplication(APPLICATION_ID)?.status).toBe('Interview')
  })

  it('updates the generated cover letter', () => {
    createApplication()

    updateApplicationCoverLetter(APPLICATION_ID, 'Updated cover letter')

    expect(getApplication(APPLICATION_ID)?.analysis.coverLetter).toBe(
      'Updated cover letter',
    )
  })

  it('updates the tailored resume draft', () => {
    createApplication()

    updateApplicationTailoredResume(APPLICATION_ID, 'Updated tailored resume')

    expect(getApplication(APPLICATION_ID)?.analysis.tailoredResume).toBe(
      'Updated tailored resume',
    )
  })

  it('saves and clears application notes', () => {
    createApplication()

    updateApplicationNotes(APPLICATION_ID, 'Follow up on Friday')
    expect(getApplication(APPLICATION_ID)?.notes).toBe('Follow up on Friday')

    updateApplicationNotes(APPLICATION_ID, '')
    expect(getApplication(APPLICATION_ID)?.notes).toBe('')
  })

  it('deletes an application', () => {
    createApplication()

    deleteApplication(APPLICATION_ID)

    expect(getApplications()).toEqual([])
  })

  it('throws when an application does not exist', () => {
    expect(() => updateApplicationStatus('missing-id', 'Applied')).toThrow(
      'Application not found.',
    )
    expect(() => deleteApplication('missing-id')).toThrow('Application not found.')
  })

  it('normalizes legacy applications that do not have notes', () => {
    const application = createApplication()
    const legacyApplication = JSON.parse(JSON.stringify(application)) as Record<
      string,
      unknown
    >
    delete legacyApplication.notes
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify([legacyApplication]))

    expect(getApplication(APPLICATION_ID)?.notes).toBe('')
  })
})
