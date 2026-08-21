// @vitest-environment happy-dom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { mockJobAnalysis } from '../mocks/jobAnalysis'
import { getApplication, getProfile } from '../services/persistenceService'
import AnalysisResultPage from './AnalysisResultPage'

vi.mock('../services/persistenceService', () => ({
  deleteApplication: vi.fn(),
  getApplication: vi.fn(),
  getProfile: vi.fn(),
  updateApplicationCoverLetter: vi.fn(),
  updateApplicationInterviewPrep: vi.fn(),
  updateApplicationNotes: vi.fn(),
  updateApplicationStatus: vi.fn(),
  updateApplicationTailoredResume: vi.fn(),
}))

const mockedGetApplication = vi.mocked(getApplication)
const mockedGetProfile = vi.mocked(getProfile)

function renderPage() {
  render(
    <MemoryRouter
      initialEntries={[{
        pathname: '/applications/northstar-frontend',
        state: { analysis: mockJobAnalysis },
      }]}
    >
      <Routes>
        <Route path="/applications/:id" element={<AnalysisResultPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockedGetApplication.mockResolvedValue(undefined)
  mockedGetProfile.mockResolvedValue({
    fullName: 'Taylor Smith',
    email: 'taylor@example.com',
    phone: '',
    location: '',
    professionalSummary: '',
    resumeText: 'React and TypeScript experience.',
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AnalysisResultPage', () => {
  it('presents the application summary and workspace controls', async () => {
    renderPage()

    expect(screen.getAllByRole('heading', { name: 'Frontend Developer' })).toHaveLength(2)
    expect(screen.getAllByText('Northstar Labs')).toHaveLength(2)
    expect(screen.getByText('DeepSeek V4 Flash')).toBeTruthy()
    expect(screen.getByText('English output')).toBeTruthy()
    expect(screen.getByText('Your application workspace')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Match score progress' })).toBeTruthy()
    expect(screen.getByLabelText('Application status')).toBeTruthy()
  })

  it('keeps all analysis sections collapsible', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Collapse all' }))

    expect(document.getElementById('skills-content')?.hidden).toBe(true)
    expect(document.getElementById('resumeImprovements-content')?.hidden).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Expand all' }))

    expect(document.getElementById('skills-content')?.hidden).toBe(false)
    expect(document.getElementById('resumeImprovements-content')?.hidden).toBe(false)
  })
})
