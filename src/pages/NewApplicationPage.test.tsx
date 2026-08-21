// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { analyzeJob, importJobDetails } from '../services/jobAnalysisService'
import { getProfile, saveApplication } from '../services/persistenceService'
import NewApplicationPage from './NewApplicationPage'

vi.mock('../services/jobAnalysisService', () => ({
  analyzeJob: vi.fn(),
  importJobDetails: vi.fn(),
}))

vi.mock('../services/persistenceService', () => ({
  getProfile: vi.fn(),
  saveApplication: vi.fn(),
}))

const mockedAnalyzeJob = vi.mocked(analyzeJob)
const mockedImportJobDetails = vi.mocked(importJobDetails)
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
  it('imports job details for review without starting an analysis', async () => {
    mockedImportJobDetails.mockResolvedValue({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: 'Build accessible React applications.',
    })
    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByLabelText(/Job listing link/),
      'https://jobs.example.com/frontend-developer',
    )
    await user.click(screen.getByRole('button', { name: 'Import job details' }))

    expect(await screen.findByDisplayValue('Northstar Labs')).toBeTruthy()
    expect(screen.getByDisplayValue('Frontend Developer')).toBeTruthy()
    expect(screen.getByDisplayValue('Build accessible React applications.')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Review them before analyzing')
    expect(mockedImportJobDetails).toHaveBeenCalledWith(
      'https://jobs.example.com/frontend-developer',
    )
    expect(mockedAnalyzeJob).not.toHaveBeenCalled()
    expect(mockedSaveApplication).not.toHaveBeenCalled()
  })

  it('keeps existing role details when a link cannot be imported', async () => {
    mockedImportJobDetails.mockRejectedValue(new Error('Blocked page'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Company name'), 'Existing Company')
    await user.type(screen.getByLabelText('Job title'), 'Existing Role')
    await user.type(screen.getByLabelText('Job description'), 'Existing description')
    await user.type(
      screen.getByLabelText(/Job listing link/),
      'https://signin.example.com/job',
    )
    await user.click(screen.getByRole('button', { name: 'Import job details' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Your existing details were kept',
    )
    expect((screen.getByLabelText('Company name') as HTMLInputElement).value).toBe(
      'Existing Company',
    )
    expect((screen.getByLabelText('Job title') as HTMLInputElement).value).toBe(
      'Existing Role',
    )
    expect((screen.getByLabelText('Job description') as HTMLTextAreaElement).value).toBe(
      'Existing description',
    )
  })

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
    await user.selectOptions(screen.getByLabelText('AI output language'), 'zh')
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
      outputLanguage: 'zh',
    })
    expect(mockedSaveApplication).not.toHaveBeenCalled()
  })
})
