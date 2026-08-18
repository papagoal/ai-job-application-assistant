// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { analyzeJob } from '../services/jobAnalysisService'
import { getProfile, saveApplication } from '../services/persistenceService'
import NewApplicationPage from './NewApplicationPage'

vi.mock('../services/jobAnalysisService', () => ({
  analyzeJob: vi.fn(),
}))

vi.mock('../services/persistenceService', () => ({
  getProfile: vi.fn(),
  saveApplication: vi.fn(),
}))

const mockedAnalyzeJob = vi.mocked(analyzeJob)
const mockedGetProfile = vi.mocked(getProfile)
const mockedSaveApplication = vi.mocked(saveApplication)

function renderPage() {
  render(
    <MemoryRouter>
      <NewApplicationPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockedGetProfile.mockResolvedValue(null)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('NewApplicationPage', () => {
  it('shows validation messages when required fields are empty', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Analyze match' }))

    expect(screen.getByText('Enter the company name.')).toBeTruthy()
    expect(screen.getByText('Enter the job title.')).toBeTruthy()
    expect(screen.getByText('Paste the job description.')).toBeTruthy()
    expect(screen.getByText('Paste your resume text.')).toBeTruthy()
    expect(mockedAnalyzeJob).not.toHaveBeenCalled()
  })

  it('prefills the saved resume and shows an analysis failure', async () => {
    mockedGetProfile.mockResolvedValue({
      fullName: 'Test Candidate',
      email: 'candidate@example.com',
      phone: '',
      location: '',
      professionalSummary: 'Frontend developer',
      resumeText: 'Saved React and TypeScript resume.',
    })
    mockedAnalyzeJob.mockRejectedValue(new Error('Network unavailable'))
    const user = userEvent.setup()
    renderPage()

    const resume = await screen.findByDisplayValue(
      'Saved React and TypeScript resume.',
    )
    await user.type(screen.getByLabelText('Company name'), 'Northstar Labs')
    await user.type(screen.getByLabelText('Job title'), 'Frontend Developer')
    await user.type(
      screen.getByLabelText('Job description'),
      'Build accessible React applications.',
    )
    await user.click(screen.getByRole('button', { name: 'Analyze match' }))

    expect(resume).toBeTruthy()
    expect((await screen.findByRole('alert')).textContent).toContain(
      'We could not analyze this application.',
    )
    expect(mockedAnalyzeJob).toHaveBeenCalledWith({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: 'Build accessible React applications.',
      resumeText: 'Saved React and TypeScript resume.',
    })
    expect(mockedSaveApplication).not.toHaveBeenCalled()
  })
})
